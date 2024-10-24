local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrTasks = import 'LrTasks'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrBinding = import 'LrBinding'
local LrFunctionContext = import 'LrFunctionContext'

local PhotoGalleryAPI = require 'PhotoGalleryInit'

local exportServiceProvider = {}

exportServiceProvider.allowFileFormats = nil
exportServiceProvider.canExportVideo = false
exportServiceProvider.supportsIncrementalPublish = true

exportServiceProvider.exportPresetFields = {
    { key = 'accessCode', default = '' },
    { key = 'apiUrl', default = 'http://localhost:3001' },
}

function exportServiceProvider.startDialog(propertyTable)
    propertyTable.accessCode = propertyTable.accessCode or ''
    propertyTable.apiUrl = propertyTable.apiUrl or 'http://localhost:3001'
    
    -- Update API URL
    PhotoGalleryAPI.setBaseUrl(propertyTable.apiUrl)
    
    -- Try to login if we have an access code
    if propertyTable.accessCode ~= '' then
        LrTasks.startAsyncTask(function()
            local success = PhotoGalleryAPI.login(propertyTable.accessCode)
            if not success then
                LrDialogs.message("Error", "Failed to authenticate with saved access code", "critical")
            end
        end)
    end
end

function exportServiceProvider.updateExportSettings(exportSettings)
    PhotoGalleryAPI.setBaseUrl(exportSettings.apiUrl)
    
    local accessCode = exportSettings.accessCode
    if accessCode and accessCode ~= '' then
        LrTasks.startAsyncTask(function()
            local success = PhotoGalleryAPI.login(accessCode)
            if not success then
                LrDialogs.message("Error", "Invalid access code", "critical")
            end
        end)
    end
end

function exportServiceProvider.sectionsForTopOfDialog(f, propertyTable)
    return {
        {
            title = "Photo Gallery Settings",
            synopsis = "Configure your Photo Gallery connection.",
            
            f:column {
                spacing = f:control_spacing(),
                
                f:row {
                    spacing = f:label_spacing(),
                    
                    f:static_text {
                        title = "API URL:",
                        alignment = 'right',
                        width = 80
                    },
                    
                    f:edit_field {
                        fill_horizontal = 1,
                        value = propertyTable.apiUrl,
                        immediate = true,
                        validate = function(value)
                            if not string.match(value, "^https?://") then
                                return false, "URL must start with http:// or https://"
                            end
                            return true
                        end
                    },
                },
                
                f:row {
                    spacing = f:label_spacing(),
                    
                    f:static_text {
                        title = "Access Code:",
                        alignment = 'right',
                        width = 80
                    },
                    
                    f:edit_field {
                        fill_horizontal = 1,
                        value = propertyTable.accessCode,
                        immediate = true
                    },
                },
                
                f:row {
                    f:push_button {
                        title = "Manage Collections",
                        action = function()
                            LrTasks.startAsyncTask(function()
                                local accessCodes = PhotoGalleryAPI.getAccessCodes()
                                if not accessCodes then
                                    LrDialogs.message("Error", "Failed to fetch collections. Please check your access code.", "critical")
                                    return
                                end
                                
                                local items = {}
                                for _, code in ipairs(accessCodes) do
                                    table.insert(items, {
                                        title = code.full_name .. " (" .. code.email .. ")",
                                        value = code.code
                                    })
                                end
                                
                                LrDialogs.presentModalDialog({
                                    title = "Photo Gallery Collections",
                                    columns = {
                                        {
                                            key = 'title',
                                            title = "Name",
                                            width = 300
                                        },
                                    },
                                    items = items,
                                    actionButtonTitle = "Select",
                                    handler = function(result)
                                        if result.value then
                                            propertyTable.accessCode = result.value
                                        end
                                    end
                                })
                            end)
                        end
                    },
                },
            },
        }
    }
end

function exportServiceProvider.processRenderedPhotos(functionContext, exportContext)
    local exportSession = exportContext.exportSession
    local accessCode = exportContext.propertyTable.accessCode
    
    if not accessCode or accessCode == "" then
        LrDialogs.message("Error", "Please enter an access code", "critical")
        return
    end
    
    local progressScope = exportContext:configureProgress({
        title = "Uploading photos to gallery...",
    })
    
    for _, rendition in exportSession:renditions() do
        if progressScope:isCanceled() then break end
        
        local success, pathOrMessage = rendition:waitForRender()
        if success then
            local uploadSuccess = PhotoGalleryAPI.uploadPhoto(pathOrMessage, accessCode)
            if not uploadSuccess then
                LrDialogs.message("Error", "Failed to upload photo", "critical")
            end
        end
    end
end

function exportServiceProvider.viewForCollectionSettings(f, publishSettings)
    return f:view {
        f:column {
            f:static_text {
                title = "Collection Settings",
                alignment = 'left',
            },
        }
    }
end

function exportServiceProvider.metadataThatTriggersRepublish(publishSettings)
    return {
        default = false,
        metadata = {},
    }
end

function exportServiceProvider.deletePhotosFromPublishedCollection(publishSettings, arrayOfPhotoIds, deletedCallback)
    for _, photoId in ipairs(arrayOfPhotoIds) do
        local success = PhotoGalleryAPI.deletePhoto(photoId)
        if success then
            deletedCallback(photoId)
        end
    end
end

function exportServiceProvider.getCollectionBehaviorInfo(publishSettings)
    return {
        defaultCollectionName = "Photo Gallery Collection",
        defaultCollectionCanBeDeleted = true,
        canAddCollection = true,
    }
end

return exportServiceProvider
