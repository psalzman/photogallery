local LrView = import 'LrView'
local LrPrefs = import 'LrPrefs'
local LrBinding = import 'LrBinding'
local LrFunctionContext = import 'LrFunctionContext'

local pluginInfoProvider = {}

function pluginInfoProvider.sectionsForTopOfDialog(f, propertyTable)
    return LrFunctionContext.callWithContext("sectionsForTopOfDialog", function(context)
        local prefs = LrPrefs.prefsForPlugin()
        
        propertyTable:addObserver(context, 'apiUrl', function(properties)
            prefs.apiUrl = properties.apiUrl
        end)
        
        propertyTable.apiUrl = prefs.apiUrl or "http://localhost:3001"
        
        return {
            {
                title = "Photo Gallery Settings",
                
                f:row {
                    f:static_text {
                        title = "API URL:",
                        alignment = 'right',
                        width = share 'labelWidth'
                    },
                    
                    f:edit_field {
                        value = LrBinding.keyBinding("apiUrl"),
                        immediate = true,
                        width_in_chars = 40
                    },
                },
            }
        }
    end)
end

return pluginInfoProvider
