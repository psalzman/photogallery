local LrHttp = import 'LrHttp'
local LrDialogs = import 'LrDialogs'
local LrTasks = import 'LrTasks'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'

local PhotoGalleryAPI = {
    baseUrl = "http://localhost:3001",
    token = nil
}

function PhotoGalleryAPI.setBaseUrl(url)
    PhotoGalleryAPI.baseUrl = url
    PhotoGalleryAPI.token = nil  -- Reset token when URL changes
end

function PhotoGalleryAPI.login(accessCode)
    local result, headers = LrHttp.post(PhotoGalleryAPI.baseUrl .. "/auth/login",
        '{"accessCode":"' .. accessCode .. '"}',
        {
            { field = 'Content-Type', value = 'application/json' },
        })
    
    if result then
        local success, response = pcall(function()
            -- Basic JSON parsing since we only need the token
            return string.match(result, '"token":"([^"]+)"')
        end)
        
        if success and response then
            PhotoGalleryAPI.token = response
            return true
        end
    end
    
    return false
end

function PhotoGalleryAPI.getAccessCodes()
    if not PhotoGalleryAPI.token then return nil end
    
    local result, headers = LrHttp.get(PhotoGalleryAPI.baseUrl .. "/access-codes",
        {
            { field = 'Authorization', value = 'Bearer ' .. PhotoGalleryAPI.token },
        })
    
    if result then
        local success, response = pcall(function()
            -- Basic parsing for access codes array
            local codes = {}
            for email, name, code in string.gmatch(result, '"email":"([^"]+)","full_name":"([^"]+)","code":"([^"]+)"') do
                table.insert(codes, {
                    email = email,
                    full_name = name,
                    code = code
                })
            end
            return codes
        end)
        
        if success then
            return response
        end
    end
    
    return nil
end

function PhotoGalleryAPI.uploadPhoto(photoPath, accessCode)
    if not PhotoGalleryAPI.token then return false end
    
    local fileName = LrPathUtils.leafName(photoPath)
    local boundary = "----WebKitFormBoundary" .. string.format("%x", os.time())
    
    -- Read the file content
    local file = io.open(photoPath, 'rb')
    if not file then return false end
    local fileContent = file:read('*all')
    file:close()
    
    -- Create multipart form data
    local body = {}
    table.insert(body, '--' .. boundary)
    table.insert(body, 'Content-Disposition: form-data; name="accessCode"')
    table.insert(body, '')
    table.insert(body, accessCode)
    table.insert(body, '--' .. boundary)
    table.insert(body, string.format('Content-Disposition: form-data; name="photos"; filename="%s"', fileName))
    table.insert(body, 'Content-Type: application/octet-stream')
    table.insert(body, '')
    table.insert(body, fileContent)
    table.insert(body, '--' .. boundary .. '--')
    
    local result, headers = LrHttp.post(PhotoGalleryAPI.baseUrl .. "/photos/upload",
        table.concat(body, '\r\n'),
        {
            { field = 'Content-Type', value = 'multipart/form-data; boundary=' .. boundary },
            { field = 'Authorization', value = 'Bearer ' .. PhotoGalleryAPI.token },
        })
    
    return result ~= nil
end

function PhotoGalleryAPI.deletePhoto(photoId)
    if not PhotoGalleryAPI.token then return false end
    
    local result, headers = LrHttp.delete(PhotoGalleryAPI.baseUrl .. "/photos/" .. photoId,
        {
            { field = 'Authorization', value = 'Bearer ' .. PhotoGalleryAPI.token },
        })
    
    return result ~= nil
end

return PhotoGalleryAPI
