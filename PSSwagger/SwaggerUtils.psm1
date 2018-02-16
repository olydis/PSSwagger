#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################


function ConvertTo-PsCustomObjectFromHashtable { 
    param ( 
        [Parameter(  
            Position = 0,   
            Mandatory = $true,   
            ValueFromPipeline = $true,  
            ValueFromPipelineByPropertyName = $true  
        )] [object[]]$hashtable 
    ); 
    
    begin { $i = 0; } 
    
    process { 
        foreach ($myHashtable in $hashtable) { 
            if ($myHashtable.GetType().Name -eq 'hashtable') { 
                $output = New-Object -TypeName PsObject; 
                Add-Member -InputObject $output -MemberType ScriptMethod -Name AddNote -Value {  
                    Add-Member -InputObject $this -MemberType NoteProperty -Name $args[0] -Value $args[1]; 
                }; 
                $myHashtable.Keys | Sort-Object | % {
                    $member = $myHashtable.$_
                    if ($member.GetType().Name -eq "PSNoteProperty") {
                        $member = $member.Value
                    }
                    $output.AddNote($_, $member);  
                } 
                $output; 
            } else { 
                Write-Warning "Index $i is not of type [hashtable]"; 
            } 
            $i += 1;  
        } 
    } 
}

function ConvertTo-HashtableFromPsCustomObject { 
     param ( 
         [Parameter(  
             Position = 0,   
             Mandatory = $true,   
             ValueFromPipeline = $true,  
             ValueFromPipelineByPropertyName = $true  
         )] [object[]]$psCustomObject 
     ); 
     
     process { 
         foreach ($myPsObject in $psCustomObject) {
             $output = @{}; 
            #  Write-Warning "VAL: $($myPsObject | ConvertTo-Json)"
             $myPsObject | Get-Member -MemberType *Property | % { 
                # Write-Warning "PROP: $($_ | ConvertTo-Json)"
                 $output.($_.name) = $myPsObject.($_.name); 
             } 
             $output; 
         } 
     } 
}
function ConvertTo-HashtableFromPsCustomObject2 { 
    param ( 
        [Parameter(  
            Position = 0,   
            Mandatory = $true,   
            ValueFromPipeline = $true,  
            ValueFromPipelineByPropertyName = $true  
        )] [object[]]$psCustomObject 
    ); 
    
    process { 
        foreach ($myPsObject in $psCustomObject) {
            $output = @{}; 
            $myPsObject | ForEach { $output[$_.Name] = $_.Value; };
            $output; 
        } 
    } 
}

$tsTemplates = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")
$tsSwaggerUtils = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")

Microsoft.PowerShell.Core\Set-StrictMode -Version Latest
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath Utilities.psm1)
Import-Module -Name 'PSSwaggerUtility'
. "$PSScriptRoot\PSSwagger.Constants.ps1" -Force
. "$PSScriptRoot\Eval-Ts.ps1" -Force
Microsoft.PowerShell.Utility\Import-LocalizedData  LocalizedData -filename PSSwagger.Resources.psd1
$script:CmdVerbTrie = $null
$script:CSharpCodeNamer = $null
$script:CSharpCodeNamerLoadAttempted = $false

$script:IgnoredAutoRestParameters = @(@('Modeler', 'm'), @('AddCredentials'), @('CodeGenerator', 'g'))
$script:PSSwaggerDefaultNamespace = "Microsoft.PowerShell"


function ConvertTo-SwaggerDictionary {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $SwaggerSpecPath,

        [Parameter(Mandatory=$true)]
        [string[]]
        $SwaggerSpecFilePaths,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$false)]
        [string]
        $ModuleName,

        [Parameter(Mandatory=$false)]
        [Version]
        $ModuleVersion = '0.0.1',

        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $ClientTypeName,

        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $ModelsName,

        [Parameter(Mandatory = $false)]
        [string]
        $DefaultCommandPrefix,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [string]
        $Header,

        [Parameter(Mandatory = $false)]
        [switch]
        $AzureSpec,

        [Parameter(Mandatory = $false)]
        [switch]
        $DisableVersionSuffix,

        [Parameter(Mandatory = $false)]
        [hashtable]
        $PowerShellCodeGen,

        [Parameter(Mandatory = $false)]
        [PSCustomObject]
        $PSMetaJsonObject
    )
    
    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $swaggerDocObject = ConvertFrom-Json ((Get-Content $SwaggerSpecPath) -join [Environment]::NewLine) -ErrorAction Stop
    $swaggerDict = @{}

    if(-not (Get-Member -InputObject $swaggerDocObject -Name 'info')) {
        Throw $LocalizedData.InvalidSwaggerSpecification
    }

    if ($PowerShellCodeGen -and (Get-Member -InputObject $swaggerDocObject -Name 'securityDefinitions')) {
        $swaggerDict['SecurityDefinitions'] = $swaggerDocObject.securityDefinitions
        if ((Get-Member -InputObject $swaggerDocObject.securityDefinitions -Name 'azure_auth')) {
            $PowerShellCodeGen['ServiceType'] = 'azure'
        }
    }

    if ((Get-Member -InputObject $swaggerDocObject -Name 'security')) {
        $swaggerDict['Security'] = $swaggerDocObject.security
    }

    $GetSwaggerInfo_params = @{
        Info = $swaggerDocObject.info
        ModuleVersion  = $ModuleVersion
    }
    if($ModuleName)
    {
        $GetSwaggerInfo_params['ModuleName'] = $ModuleName
    }
    if($ClientTypeName) {
        $GetSwaggerInfo_params['ClientTypeName'] = $ClientTypeName
    }
    if($ModelsName) {
        $GetSwaggerInfo_params['ModelsName'] = $ModelsName
    }
    $swaggerDict['Info'] = Get-SwaggerInfo @GetSwaggerInfo_params
    $swaggerDict['Info']['DefaultCommandPrefix'] = $DefaultCommandPrefix
    if($Header) {
        $swaggerDict['Info']['Header'] = $Header
    }

    if ((Get-Member -InputObject $swaggerDocObject.info -Name 'x-ps-module-info') -and
        (Get-Member -InputObject $swaggerDocObject.info.'x-ps-module-info' -Name 'commandDefaults')) {
        $swaggerDict['CommandDefaults'] = @{}
        foreach ($property in (Get-Member -InputObject $swaggerDocObject.info.'x-ps-module-info'.commandDefaults -MemberType NoteProperty)) {
            $swaggerDict['CommandDefaults'][$property.Name] = $swaggerDocObject.info.'x-ps-module-info'.commandDefaults.$($property.Name)
        }
    } elseif ($PSMetaJsonObject -and (Get-Member -InputObject $PSMetaJsonObject -Name 'info') -and
              (Get-Member -InputObject $PSMetaJsonObject.info -Name 'x-ps-module-info') -and
              (Get-Member -InputObject $PSMetaJsonObject.info.'x-ps-module-info' -Name 'commandDefaults')) {
        $swaggerDict['CommandDefaults'] = @{}
        foreach ($property in (Get-Member -InputObject $PSMetaJsonObject.info.'x-ps-module-info'.commandDefaults -MemberType NoteProperty)) {
            $swaggerDict['CommandDefaults'][$property.Name] = $PSMetaJsonObject.info.'x-ps-module-info'.commandDefaults.$($property.Name)
        }
    }

    $SwaggerParameters = @{}
    $SwaggerDefinitions = @{}
    $SwaggerPaths = @{}

    $PSMetaParametersJsonObject = $null
    if($PSMetaJsonObject) {
        if(Get-Member -InputObject $PSMetaJsonObject -Name 'parameters'){
            $PSMetaParametersJsonObject = $PSMetaJsonObject.parameters
        }
    }
    foreach($FilePath in $SwaggerSpecFilePaths) {
        $swaggerObject = ConvertFrom-Json ((Get-Content $FilePath) -join [Environment]::NewLine) -ErrorAction Stop
        if(Get-Member -InputObject $swaggerObject -Name 'parameters') {
            
            $GetSwaggerParameters_Params = @{
                Parameters = $swaggerObject.parameters
                Info = $swaggerDict['Info']
                SwaggerParameters = $swaggerParameters
                DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                AzureSpec = $AzureSpec
                PSMetaParametersJsonObject = $PSMetaParametersJsonObject
            }

            Get-SwaggerParameters @GetSwaggerParameters_Params
        }

        if(Get-Member -InputObject $swaggerObject -Name 'definitions') {
            Get-SwaggerDefinitionMultiItemObject -Object $swaggerObject.definitions -SwaggerDictionary $SwaggerDefinitions
        }

        if(-not (Get-Member -InputObject $swaggerObject -Name 'paths') -or 
           -not (Get-HashtableKeyCount -Hashtable $swaggerObject.Paths.PSObject.Properties)) {
            Write-Warning -Message ($LocalizedData.SwaggerPathsMissing -f $FilePath)
        }

        Get-SwaggerPathMultiItemObject -Object $swaggerObject.paths -SwaggerDictionary $SwaggerPaths
    }

    $swaggerDict['Parameters'] = $swaggerParameters
    $swaggerDict['Definitions'] = $swaggerDefinitions
    $swaggerDict['Paths'] = $swaggerPaths

    return $swaggerDict
}

function Get-SwaggerInfo {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Info,

        [Parameter(Mandatory=$false)]
        [string]
        $ModuleName,

        [Parameter(Mandatory=$false)]
        [Version]
        $ModuleVersion = '0.0.1',

        [Parameter(Mandatory=$false)]
        [string]
        $ClientTypeName,

        [Parameter(Mandatory=$false)]
        [string]
        $ModelsName
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $infoVersion = '1-0-0'
    if((Get-Member -InputObject $Info -Name 'Version') -and $Info.Version) { 
        $infoVersion = $Info.Version
    }

    $infoTitle = $Info.title
    $CodeOutputDirectory = ''
    $infoName = ''
    $NameSpace = ''
    $codeGenFileRequired = $false
    if(-not $ModelsName) {
        $modelsName = 'Models'
    }

    $Header = ''    
    if(Get-Member -InputObject $Info -Name 'x-ms-code-generation-settings') {
        $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases @('ClientName', 'Name')
        if ($prop) {
            $infoName = $Info.'x-ms-code-generation-settings'.$prop
        }

        $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases @('OutputDirectory', 'o', 'output')
        if ($prop) {
            # When OutputDirectory is specified, we'll have to copy the code from here to the module directory later on
            $CodeOutputDirectory = $Info.'x-ms-code-generation-settings'.$prop
            if ((Test-Path -Path $CodeOutputDirectory) -and (Get-ChildItem -Path (Join-Path -Path $CodeOutputDirectory -ChildPath "*.cs") -Recurse)) {
                throw $LocalizedData.OutputDirectoryMustBeEmpty -f ($CodeOutputDirectory)
            } else {
                Write-Warning -Message ($LocalizedData.CodeDirectoryWillBeCreated -f $CodeOutputDirectory)
            }
        }

        if(-not $PSBoundParameters.ContainsKey('ModelsName')) {
            $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases @('ModelsName', 'mname')
            if ($prop) {
                # When ModelsName is specified, this changes the subnamespace of the models from 'Models' to whatever is specified
                $modelsName = $Info.'x-ms-code-generation-settings'.$prop
            }
        }

        $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases @('Namespace', 'n')
        if ($prop) {
            # When NameSpace is specified, this overrides our namespace
            $NameSpace = $Info.'x-ms-code-generation-settings'.$prop
            # Warn the user that custom namespaces are not recommended
            Write-Warning -Message $LocalizedData.CustomNamespaceNotRecommended
        }

        $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases @('Header', 'h')
        if ($prop) {
            $Header = $Info.'x-ms-code-generation-settings'.$prop
        }

        # When the following values are specified, the property will be overwritten by PSSwagger using a CodeGenSettings file
        foreach ($ignoredParameterAliases in $script:IgnoredAutoRestParameters) {
            $prop = Test-PropertyWithAliases -InputObject $Info.'x-ms-code-generation-settings' -Aliases $ignoredParameterAliases
            if ($prop) {
                Write-Warning -Message ($LocalizedData.AutoRestParameterIgnored -f ($prop, $Info.'x-ms-code-generation-settings'.$prop))
                $codeGenFileRequired = $true
            }
        }
    }

    if (-not $infoName) {
        # Remove special characters as info name is used as client variable name in the generated commands.
        $infoName = ($infoTitle -replace '[^a-zA-Z0-9_]','')
    }

    $Description = ''
    if((Get-Member -InputObject $Info -Name 'Description') -and $Info.Description) { 
        $Description = $Info.Description
    }

    $ProjectUri = ''
    $ContactEmail = ''
    $ContactName = ''
    if(Get-Member -InputObject $Info -Name 'Contact')
    {
        # The identifying name of the contact person/organization.
        if((Get-Member -InputObject $Info.Contact -Name 'Name') -and
            $Info.Contact.Name)
        { 
            $ContactName = $Info.Contact.Name
        }

        # The URL pointing to the contact information. MUST be in the format of a URL.
        if((Get-Member -InputObject $Info.Contact -Name 'Url') -and
            $Info.Contact.Url)
        { 
            $ProjectUri = $Info.Contact.Url
        }

        # The email address of the contact person/organization. MUST be in the format of an email address.
        if((Get-Member -InputObject $Info.Contact -Name 'Email') -and
            $Info.Contact.Email)
        { 
            $ContactEmail = $Info.Contact.Email
        }        
    }

    $LicenseUri = ''
    $LicenseName = ''
    if(Get-Member -InputObject $Info -Name 'License')
    {
        # A URL to the license used for the API. MUST be in the format of a URL.
        if((Get-Member -InputObject $Info.License -Name 'Url') -and
          $Info.License.Url)
        { 
            $LicenseUri = $Info.License.Url
        }

        # License name.
        if((Get-Member -InputObject $Info.License -Name 'Name') -and
          $Info.License.Name)
        { 
            $LicenseName = $Info.License.Name
        }
    }

    # Using the info name as module name when $ModuleName is not specified.
    # This is required for PSMeta generaration.
    if(-not $ModuleName)
    {
        $ModuleName = $infoName
    }

    if (-not $NameSpace) {
        # Default namespace supports sxs
        $NamespaceVersionSuffix = "v$("$ModuleVersion" -replace '\.','')"
        $NameSpace = "$script:PSSwaggerDefaultNamespace.$ModuleName.$NamespaceVersionSuffix"
    }

    if($ClientTypeName) {        
        # Get the namespace from namespace qualified client type name.
        $LastDotIndex = $ClientTypeName.LastIndexOf('.')        
        if($LastDotIndex -ne -1){
            $NameSpace = $ClientTypeName.Substring(0, $LastDotIndex)
            $ClientTypeName = $ClientTypeName.Substring($LastDotIndex+1)
        }
    }
    else {
        # AutoRest generates client name with 'Client' appended to info title when a NameSpace part is same as the info name.
        if($NameSpace.Split('.', [System.StringSplitOptions]::RemoveEmptyEntries) -contains $infoName) {
            $ClientTypeName = $infoName + 'Client'
        }
        else {
            $ClientTypeName = $infoName
        }
    }

    return @{
        InfoVersion = $infoVersion
        InfoTitle = $infoTitle
        InfoName = $infoName
        ClientTypeName = $ClientTypeName
        Version = $ModuleVersion
        NameSpace = $NameSpace
        ModuleName = $ModuleName
        Description = $Description
        ContactName = $ContactName
        ContactEmail = $ContactEmail
        ProjectUri = $ProjectUri
        LicenseUri = $LicenseUri
        LicenseName = $LicenseName
        CodeOutputDirectory = $CodeOutputDirectory
        CodeGenFileRequired = $codeGenFileRequired
        Models = $modelsName
        Header = $Header
    }
}

function Test-PropertyWithAliases {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $InputObject,

        [Parameter(Mandatory=$true)]
        [string[]]
        $Aliases
    )

    foreach ($alias in $Aliases) {
        if ((Get-Member -InputObject $InputObject -Name $alias) -and $InputObject.$alias) {
            return $alias
        }
    }

    return $null
}

function Get-SwaggerParameters {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Parameters,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Info,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $SwaggerParameters,

        [Parameter(Mandatory = $false)]
        [switch]
        $AzureSpec,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaParametersJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    foreach($Parameter in $Parameters.PSObject.Properties.GetEnumerator()) {
        $GlobalParameterName = $Parameter.Name
        $GPJsonValueObject = $Parameter.Value

        if ($SwaggerParameters.ContainsKey($GlobalParameterName))
        {
            Write-Verbose -Message ($LocalizedData.SkippingExistingParameter -f $GlobalParameterName)
            continue
        }

        $IsParamMandatory = '$false'
        $ParameterDescription = ''
        $x_ms_parameter_location = 'client'
        $x_ms_parameter_grouping = ''
        $ConstantValue = ''
        $ReadOnlyGlobalParameter = $false
        if ((Get-Member -InputObject $GPJsonValueObject -Name 'x-ms-client-name') -and $GPJsonValueObject.'x-ms-client-name') {
            $parameterName = Get-PascalCasedString -Name $GPJsonValueObject.'x-ms-client-name'
        } elseif ((Get-Member -InputObject $GPJsonValueObject -Name 'Name') -and $GPJsonValueObject.Name)
        {
            $parameterName = Get-PascalCasedString -Name $GPJsonValueObject.Name
        }

        if(Get-Member -InputObject $GPJsonValueObject -Name 'x-ms-parameter-location')
        {
            $x_ms_parameter_location = $GPJsonValueObject.'x-ms-parameter-location'
        }

        if ($AzureSpec) {
            # Some global parameters have constant values not expressed in the Swagger spec when dealing with Azure
            if ('subscriptionId' -eq $parameterName) {
                # See PSSwagger.Constants.ps1 $functionBodyStr for this variable name
                $ConstantValue = '`$subscriptionId'
            } elseif ('apiversion' -eq $parameterName) {
                $ReadOnlyGlobalParameter = $true
            }       
        }

        if((Get-Member -InputObject $GPJsonValueObject -Name 'Required') -and
            $GPJsonValueObject.Required)
        {
            $IsParamMandatory = '$true'
        }

        if ((Get-Member -InputObject $GPJsonValueObject -Name 'Description') -and
            $GPJsonValueObject.Description)
        {
            $ParameterDescription = $GPJsonValueObject.Description
        }

        $GetParamTypeParams = @{
            ParameterJsonObject = $GPJsonValueObject
            ModelsNameSpace = "$($Info.NameSpace).$($Info.Models)"
            ParameterName = $parameterName
            DefinitionFunctionsDetails = $DefinitionFunctionsDetails
        }

        $paramTypeObject = Get-ParamType @GetParamTypeParams

        if (Get-Member -InputObject $GPJsonValueObject -Name 'x-ms-parameter-grouping') {
            $groupObject = $GPJsonValueObject.'x-ms-parameter-grouping'
            if (Get-Member -InputObject $groupObject -Name 'name') {
                $parsedName = Get-ParameterGroupName -RawName $groupObject.name
            } elseif (Get-Member -InputObject $groupObject -Name 'postfix') {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId -Postfix $groupObject.postfix
            } else {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId
            }

            $x_ms_parameter_grouping = $parsedName
        }

        $FlattenOnPSCmdlet = $false
        if($PSMetaParametersJsonObject -and 
          (Get-Member -InputObject $PSMetaParametersJsonObject -Name $GlobalParameterName) -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$GlobalParameterName -Name 'x-ps-parameter-info') -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$GlobalParameterName.'x-ps-parameter-info' -Name 'flatten')) {
            $FlattenOnPSCmdlet = $PSMetaParametersJsonObject.$GlobalParameterName.'x-ps-parameter-info'.'flatten'
        }

        $SwaggerParameters[$GlobalParameterName] = @{
            Name = $parameterName
            Type = $paramTypeObject.ParamType
            ValidateSet = $paramTypeObject.ValidateSetString
            Mandatory = $IsParamMandatory
            Description = $ParameterDescription
            IsParameter = $paramTypeObject.IsParameter
            x_ms_parameter_location = $x_ms_parameter_location
            x_ms_parameter_grouping = $x_ms_parameter_grouping
            ConstantValue = $ConstantValue
            ReadOnlyGlobalParameter = $ReadOnlyGlobalParameter
            FlattenOnPSCmdlet = $FlattenOnPSCmdlet
        }
    }
}

function Get-SwaggerPathMultiItemObject {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Object,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $SwaggerDictionary
    )

    $Object.PSObject.Properties | ForEach-Object {
        if($SwaggerDictionary.ContainsKey($_.name)) {
            Write-Verbose -Message ($LocalizedData.SkippingExistingKeyFromSwaggerMultiItemObject -f $_)
        } else {
            $SwaggerDictionary[$_.name] = $_
        }
    }
}

function Get-SwaggerDefinitionMultiItemObject {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $Object,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $SwaggerDictionary
    )

    $Object.PSObject.Properties | ForEach-Object {
        $ModelName = Get-CSharpModelName -Name $_.Name
        if($SwaggerDictionary.ContainsKey($ModelName)) {
            Write-Verbose -Message ($LocalizedData.SkippingExistingKeyFromSwaggerMultiItemObject -f $ModelName)
        } else {
            $SwaggerDictionary[$ModelName] = $_
        }
    }
}

function Get-PathParamInfo
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $JsonPathItemObject,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $SwaggerDict,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterGroupCache,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParametersTable,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaParametersJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $index = (Get-HashtableKeyCount -Hashtable $ParametersTable)
    $operationId = $null
    if(Get-Member -InputObject $JsonPathItemObject -Name 'OperationId'){
        $operationId = $JsonPathItemObject.operationId
    }
    
    if(Get-Member -InputObject $JsonPathItemObject -Name 'Parameters'){
        $JsonPathItemObject.parameters | ForEach-Object {
            $AllParameterDetails = Get-ParameterDetails -ParameterJsonObject $_ `
                                                        -SwaggerDict $SwaggerDict `
                                                        -DefinitionFunctionsDetails $DefinitionFunctionsDetails `
                                                        -OperationId $operationId `
                                                        -ParameterGroupCache $ParameterGroupCache `
                                                        -PSMetaParametersJsonObject $PSMetaParametersJsonObject
            foreach ($ParameterDetails in $AllParameterDetails) {
                if($ParameterDetails -and ($ParameterDetails.ContainsKey('x_ms_parameter_grouping_group') -or $ParameterDetails.Type))
                {
                    $ParametersTable["$index"] = $ParameterDetails
                    $index = $index + 1            
                }
            }
        }
    }
}

function Get-ParameterDetails
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [PSObject]
        $ParameterJsonObject,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $SwaggerDict,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$false)]
        [string]
        $OperationId,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterGroupCache,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaParametersJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $NameSpace = $SwaggerDict['Info'].NameSpace
    $Models = $SwaggerDict['Info'].Models
    $DefinitionTypeNamePrefix = "$Namespace.$Models."
    $parameterName = ''
    if ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-name') -and $ParameterJsonObject.'x-ms-client-name') {
        $parameterName = Get-PascalCasedString -Name $ParameterJsonObject.'x-ms-client-name'
    } elseif ((Get-Member -InputObject $ParameterJsonObject -Name 'Name') -and $ParameterJsonObject.Name)
    {
        $parameterName = Get-PascalCasedString -Name $ParameterJsonObject.Name
    }
   
    $GetParamTypeParameters = @{
        ParameterJsonObject = $ParameterJsonObject
        ModelsNamespace = "$NameSpace.$Models"
        ParameterName = $parameterName
        DefinitionFunctionsDetails = $DefinitionFunctionsDetails
        SwaggerDict = $SwaggerDict
    }

    $paramTypeObject = Get-ParamType @GetParamTypeParameters

    # Swagger Path Operations can be defined with reference to the global method based parameters.
    # Add the method based global parameters as a function parameter.
    $AllParameterDetailsArrayTemp = @()
    $x_ms_parameter_grouping = ''
    if($paramTypeObject.GlobalParameterDetails)
    {
        $ParameterDetails = $paramTypeObject.GlobalParameterDetails
        $x_ms_parameter_grouping = $ParameterDetails.'x_ms_parameter_grouping'
    }
    else
    {
        $IsParamMandatory = '$false'
        $ParameterDescription = ''
        $x_ms_parameter_location = 'method'

        if ((Get-Member -InputObject $ParameterJsonObject -Name 'Required') -and 
            $ParameterJsonObject.Required)
        {
            $IsParamMandatory = '$true'
        }

        if ((Get-Member -InputObject $ParameterJsonObject -Name 'Description') -and 
            $ParameterJsonObject.Description)
        {
            $ParameterDescription = $ParameterJsonObject.Description
        }

        if ($OperationId -and (Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-parameter-grouping')) {
            $groupObject = $ParameterJsonObject.'x-ms-parameter-grouping'
            if (Get-Member -InputObject $groupObject -Name 'name') {
                $parsedName = Get-ParameterGroupName -RawName $groupObject.name
            } elseif (Get-Member -InputObject $groupObject -Name 'postfix') {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId -Postfix $groupObject.postfix
            } else {
                $parsedName = Get-ParameterGroupName -OperationId $OperationId
            }

            $x_ms_parameter_grouping = $parsedName
        }

        $FlattenOnPSCmdlet = $false
        if($PSMetaParametersJsonObject -and 
          (Get-Member -InputObject $PSMetaParametersJsonObject -Name $parameterName) -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$parameterName -Name 'x-ps-parameter-info') -and
          (Get-Member -InputObject $PSMetaParametersJsonObject.$parameterName.'x-ps-parameter-info' -Name 'flatten')) {
            $FlattenOnPSCmdlet = $PSMetaParametersJsonObject.$parameterName.'x-ps-parameter-info'.'flatten'
        }

        $ParameterDetails = @{
            Name = $parameterName
            Type = $paramTypeObject.ParamType
            ValidateSet = $paramTypeObject.ValidateSetString
            Mandatory = $IsParamMandatory
            Description = $ParameterDescription
            IsParameter = $paramTypeObject.IsParameter
            x_ms_parameter_location = $x_ms_parameter_location
            x_ms_parameter_grouping = $x_ms_parameter_grouping
            OriginalParameterName = $ParameterJsonObject.Name
            FlattenOnPSCmdlet = $FlattenOnPSCmdlet
        }
    }

    if ((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-flatten') -and $ParameterJsonObject.'x-ms-client-flatten') {
        $referenceTypeName = $ParameterDetails.Type.Replace($DefinitionTypeNamePrefix, '')
        # If the parameter should be flattened, return an array of parameter detail objects for each parameter of the referenced definition
        Write-Verbose -Message ($LocalizedData.FlatteningParameterType -f ($parameterName, $referenceTypeName))
        $AllParameterDetails = @{}
        Expand-Parameters -ReferenceTypeName $referenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
        foreach ($expandedParameterDetail in $AllParameterDetails.GetEnumerator()) {
            Write-Verbose -Message ($LocalizedData.ParameterExpandedTo -f ($parameterName, $expandedParameterDetail.Key))
            $AllParameterDetailsArrayTemp += $expandedParameterDetail.Value
        }
    } else {
        # If the parameter shouldn't be flattened, just return the original parameter detail object
        $AllParameterDetailsArrayTemp += $ParameterDetails
    }

    # Loop through the parameters in case they belong to different groups after being expanded
    $AllParameterDetailsArray = @()
    foreach ($expandedParameterDetail in $AllParameterDetailsArrayTemp) {
        # The parent parameter object, wherever it is, set a grouping name
        if ($x_ms_parameter_grouping) {
            $expandedParameterDetail.'x_ms_parameter_grouping' = $x_ms_parameter_grouping
            # An empty parameter details object is created that contains all known parameters in this group
            if ($ParameterGroupCache.ContainsKey($x_ms_parameter_grouping)) {
                $ParameterDetails = $ParameterGroupCache[$x_ms_parameter_grouping]
            } else {
                $ParameterDetails = @{
                    Name = $x_ms_parameter_grouping
                    x_ms_parameter_grouping_group = @{}
                    IsParameter = $true
                }
            }

            if (-not $ParameterDetails.'x_ms_parameter_grouping_group'.ContainsKey($expandedParameterDetail.Name)) {
                $ParameterDetails.'x_ms_parameter_grouping_group'[$expandedParameterDetail.Name] = $expandedParameterDetail
            }

            $AllParameterDetailsArray += $ParameterDetails
            $ParameterGroupCache[$x_ms_parameter_grouping] = $ParameterDetails
        } else {
            $AllParameterDetailsArray += $expandedParameterDetail
        }
    }

    # Properties of ParameterDetails object
    # .x_ms_parameter_grouping - string - non-empty if this is part of a group, contains the group's parsed name (should be the C# Type name)
    # .x_ms_parameter_grouping_group - hashtable - table of parameter names to ParameterDetails, indicates this ParameterDetails object is a grouping
    return $AllParameterDetailsArray
}

function Expand-Parameters {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $AllParameterDetails
    )

    # Expand unexpanded x-ms-client-flatten
    # Leave it unexpanded afterwards
    if ($DefinitionFunctionsDetails[$ReferenceTypeName].ContainsKey('Unexpanded_x_ms_client_flatten_DefinitionNames') -and
        ($DefinitionFunctionsDetails[$ReferenceTypeName].'Unexpanded_x_ms_client_flatten_DefinitionNames'.Count -gt 0)) {
        foreach ($unexpandedDefinitionName in $DefinitionFunctionsDetails[$ReferenceTypeName].'Unexpanded_x_ms_client_flatten_DefinitionNames') {
            if ($DefinitionFunctionsDetails[$unexpandedDefinitionName].ContainsKey('ExpandedParameters') -and -not $DefinitionFunctionsDetails[$unexpandedDefinitionName].ExpandedParameters) {
                Expand-Parameters -ReferenceTypeName $unexpandedDefinitionName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
            }

            Flatten-ParameterTable -ReferenceTypeName $unexpandedDefinitionName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
        }
    }

    Flatten-ParameterTable -ReferenceTypeName $ReferenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails -AllParameterDetails $AllParameterDetails
}

<#
.DESCRIPTION
   Flattens the given type's parameter table into cmdlet parameters.
#>
function Flatten-ParameterTable {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $AllParameterDetails
    )
    foreach ($parameterEntry in $DefinitionFunctionsDetails[$ReferenceTypeName]['ParametersTable'].GetEnumerator()) {
        if ($AllParameterDetails.ContainsKey($parameterEntry.Key)) {
            throw $LocalizedData.DuplicateExpandedProperty -f ($parameterEntry.Key)
        }

        $AllParameterDetails[$parameterEntry.Key] = Clone-ParameterDetail -ParameterDetail $parameterEntry.Value -OtherEntries @{'IsParameter'=$true}
    }
}

<#
.DESCRIPTION
   Clones a given parameter detail object by shallow copying all properties. Optionally adds additional entries.
#>
function Clone-ParameterDetail {
    param(
        [Parameter(Mandatory=$true)]
        [hashtable]
        $ParameterDetail,

        [Parameter(Mandatory=$false)]
        [hashtable]
        $OtherEntries
    )

    $clonedParameterDetail = @{}
    foreach ($kvp in $ParameterDetail.GetEnumerator()) {
        $clonedParameterDetail[$kvp.Key] = $kvp.Value
    }

    foreach ($kvp in $OtherEntries.GetEnumerator()) {
        $clonedParameterDetail[$kvp.Key] = $kvp.Value
    }

    return $clonedParameterDetail
}

function Get-ParamType
{
    [CmdletBinding()]
	param
	(
        [Parameter(Mandatory=$true)]
        [PSObject]
        $ParameterJsonObject,

        [Parameter(Mandatory=$true)]
        [string]
        $ModelsNamespace,

        [Parameter(Mandatory=$true)]
        [string]
        [AllowEmptyString()]
        $ParameterName,

        [Parameter(Mandatory=$false)]
        [hashtable]
        $SwaggerDict,

        [Parameter(Mandatory=$false)]
        [hashtable]
        $DefinitionFunctionsDetails
	)

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $DefinitionTypeNamePrefix = "$ModelsNamespace."
    $paramType = ""
    $ValidateSetString = $null
    $isParameter = $true
    $GlobalParameterDetails = $null
    $ReferenceTypeName = $null
    if((Get-Member -InputObject $ParameterJsonObject -Name 'Type') -and $ParameterJsonObject.Type)
    {
        $paramType = $ParameterJsonObject.Type

        # Use the format as parameter type if that is available as a type in PowerShell
        if ((Get-Member -InputObject $ParameterJsonObject -Name 'Format') -and 
            $ParameterJsonObject.Format -and 
            ($null -ne ($ParameterJsonObject.Format -as [Type]))) 
        {
            $paramType = $ParameterJsonObject.Format
        }
        elseif (($ParameterJsonObject.Type -eq 'array') -and
                (Get-Member -InputObject $ParameterJsonObject -Name 'Items') -and 
                $ParameterJsonObject.Items)
        {
            if((Get-Member -InputObject $ParameterJsonObject.Items -Name '$ref') -and 
                $ParameterJsonObject.Items.'$ref')
            {
                $ReferenceTypeValue = $ParameterJsonObject.Items.'$ref'
                $ReferenceTypeName = Get-CSharpModelName -Name $ReferenceTypeValue.Substring( $( $ReferenceTypeValue.LastIndexOf('/') ) + 1 )
                $ResolveReferenceParameterType_params = @{
                    DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                    ReferenceTypeName          = $ReferenceTypeName
                    DefinitionTypeNamePrefix   = $DefinitionTypeNamePrefix
                }
                $ResolvedResult = Resolve-ReferenceParameterType @ResolveReferenceParameterType_params
                $paramType = $ResolvedResult.ParameterType + '[]'
                if($ResolvedResult.ValidateSetString) {
                    $ValidateSetString = $ResolvedResult.ValidateSetString
                }
            }
            elseif((Get-Member -InputObject $ParameterJsonObject.Items -Name 'Type') -and $ParameterJsonObject.Items.Type)
            {
                $ReferenceTypeName = Get-PSTypeFromSwaggerObject -JsonObject $ParameterJsonObject.Items
                $paramType = "$($ReferenceTypeName)[]"
            }
        }
        elseif ((Get-Member -InputObject $ParameterJsonObject -Name 'AdditionalProperties') -and 
                $ParameterJsonObject.AdditionalProperties)
        {
            # Dictionary
            if($ParameterJsonObject.Type -eq 'object') {
                if((Get-Member -InputObject $ParameterJsonObject.AdditionalProperties -Name 'Type') -and
                $ParameterJsonObject.AdditionalProperties.Type) {
                    $AdditionalPropertiesType = Get-PSTypeFromSwaggerObject -JsonObject $ParameterJsonObject.AdditionalProperties
                    $paramType = "System.Collections.Generic.Dictionary[[$AdditionalPropertiesType],[$AdditionalPropertiesType]]"
                }
                elseif((Get-Member -InputObject $ParameterJsonObject.AdditionalProperties -Name '$ref') -and
                    $ParameterJsonObject.AdditionalProperties.'$ref')
                {
                    $ReferenceTypeValue = $ParameterJsonObject.AdditionalProperties.'$ref'
                    $ReferenceTypeName = Get-CSharpModelName -Name $ReferenceTypeValue.Substring( $( $ReferenceTypeValue.LastIndexOf('/') ) + 1 )
                    $ResolveReferenceParameterType_params = @{
                        DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                        ReferenceTypeName          = $ReferenceTypeName
                        DefinitionTypeNamePrefix   = $DefinitionTypeNamePrefix
                    }
                    $ResolvedResult = Resolve-ReferenceParameterType @ResolveReferenceParameterType_params
                    $paramType = "System.Collections.Generic.Dictionary[[string],[$($ResolvedResult.ParameterType)]]"
                }
                else {
                    $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('ParameterJsonObject', $($ParameterJsonObject | Out-String))
                    Write-Warning -Message $Message
                }
            }
            elseif($ParameterJsonObject.Type -eq 'string') {
                if((Get-Member -InputObject $ParameterJsonObject.AdditionalProperties -Name 'Type') -and
                   ($ParameterJsonObject.AdditionalProperties.Type -eq 'array'))
                {
                    if(Get-Member -InputObject $ParameterJsonObject.AdditionalProperties -Name 'Items')
                    {
                        if((Get-Member -InputObject $ParameterJsonObject.AdditionalProperties.Items -Name 'Type') -and
                           $ParameterJsonObject.AdditionalProperties.Items.Type)
                        { 
                            $ItemsType = Get-PSTypeFromSwaggerObject -JsonObject $ParameterJsonObject.AdditionalProperties.Items
                            $paramType = "System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[$ItemsType]]]"
                        }
                        elseif((Get-Member -InputObject $ParameterJsonObject.AdditionalProperties.Items -Name '$ref') -and
                               $ParameterJsonObject.AdditionalProperties.Items.'$ref')
                        {
                            $ReferenceTypeValue = $ParameterJsonObject.AdditionalProperties.Items.'$ref'
                            $ReferenceTypeName = Get-CSharpModelName -Name $ReferenceTypeValue.Substring( $( $ReferenceTypeValue.LastIndexOf('/') ) + 1 )
                            $ResolveReferenceParameterType_params = @{
                                DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                                ReferenceTypeName          = $ReferenceTypeName
                                DefinitionTypeNamePrefix   = $DefinitionTypeNamePrefix
                            }
                            $ResolvedResult = Resolve-ReferenceParameterType @ResolveReferenceParameterType_params
                            $paramType = "System.Collections.Generic.Dictionary[[string],[System.Collections.Generic.List[$($ResolvedResult.ParameterType)]]]"
                        }
                        else
                        {
                            $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('ParameterJsonObject', $($ParameterJsonObject | Out-String))
                            Write-Warning -Message $Message
                        }
                    }
                    else
                    {
                        $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('ParameterJsonObject', $($ParameterJsonObject | Out-String))
                        Write-Warning -Message $Message
                    }
                }
                else
                {
                    $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('ParameterJsonObject', $($ParameterJsonObject | Out-String))
                    Write-Warning -Message $Message
                }
            }
            else {
                $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('ParameterJsonObject', $($ParameterJsonObject | Out-String))
                Write-Warning -Message $Message
            }
        }
    }
    elseif($parameterName -eq 'Properties' -and
           (Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-flatten') -and 
           ($ParameterJsonObject.'x-ms-client-flatten') )
    {
        # 'x-ms-client-flatten' extension allows to flatten deeply nested properties into the current definition.
        # Users often provide feedback that they don't want to create multiple levels of properties to be able to use an operation. 
        # By applying the x-ms-client-flatten extension, you move the inner properties to the top level of your definition.

        $ReferenceParameterValue = $ParameterJsonObject.'$ref'
        $x_ms_client_flatten_ReferenceTypeName = Get-CSharpModelName -Name $ReferenceParameterValue.Substring( $( $ReferenceParameterValue.LastIndexOf('/') ) + 1 )
        Set-TypeUsedAsClientFlatten -ReferenceTypeName $x_ms_client_flatten_ReferenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails
    }
    elseif ( (Get-Member -InputObject $ParameterJsonObject -Name '$ref') -and ($ParameterJsonObject.'$ref') )
    {
        <#
            Currently supported parameter references:
                #/parameters/<PARAMETERNAME> or #../../<Parameters>.Json/parameters/<PARAMETERNAME>
                #/definitions/<DEFINITIONNAME> or #../../<Definitions>.Json/definitions/<DEFINITIONNAME>
        #>
        $ReferenceParameterValue = $ParameterJsonObject.'$ref'
        $ReferenceParts = $ReferenceParameterValue -split '/' | ForEach-Object { if($_.Trim()){ $_.Trim() } }
        if($ReferenceParts.Count -ge 3)
        {
            if($ReferenceParts[-2] -eq 'Parameters')
            {
                #  #<...>/parameters/<PARAMETERNAME>
                $GlobalParameters = $SwaggerDict['Parameters']
                # Cloning the common parameters object so that some values can be updated without impacting other operations.
                $GlobalParamDetails = $GlobalParameters[$ReferenceParts[-1]].Clone()

                # Get the definition name of the global parameter so that 'New-<DefinitionName>Object' can be generated.
                if($GlobalParamDetails.Type -and $GlobalParamDetails.Type -match '[.]') {
                    $ReferenceTypeName = ($GlobalParamDetails.Type -split '[.]')[-1]
                }

                # Valid values for this extension are: "client", "method".
                $GlobalParameterDetails = $GlobalParamDetails
                if(-not ($GlobalParamDetails -and 
                   $GlobalParamDetails.ContainsKey('x_ms_parameter_location') -and 
                   ($GlobalParamDetails.x_ms_parameter_location -eq 'method')))
                {
                    $isParameter = $false
                }
            }
            elseif($ReferenceParts[-2] -eq 'Definitions')
            {
                #  #<...>/definitions/<DEFINITIONNAME>
                $ReferenceTypeName = Get-CSharpModelName -Name $ReferenceParts[-1]
                $ResolveReferenceParameterType_params = @{
                    DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                    ReferenceTypeName          = $ReferenceTypeName
                    DefinitionTypeNamePrefix   = $DefinitionTypeNamePrefix
                }
                $ResolvedResult = Resolve-ReferenceParameterType @ResolveReferenceParameterType_params
                $paramType = $ResolvedResult.ParameterType
                if($ResolvedResult.ValidateSetString) {
                    $ValidateSetString = $ResolvedResult.ValidateSetString
                }
            }
        }
    }
    elseif ((Get-Member -InputObject $ParameterJsonObject -Name 'Schema') -and ($ParameterJsonObject.Schema) -and
            (Get-Member -InputObject $ParameterJsonObject.Schema -Name '$ref') -and ($ParameterJsonObject.Schema.'$ref') )
    {
        $ReferenceParameterValue = $ParameterJsonObject.Schema.'$ref'
        $ReferenceTypeName = Get-CSharpModelName -Name $ReferenceParameterValue.Substring( $( $ReferenceParameterValue.LastIndexOf('/') ) + 1 )

        $ResolveReferenceParameterType_params = @{
            DefinitionFunctionsDetails = $DefinitionFunctionsDetails
            ReferenceTypeName          = $ReferenceTypeName
            DefinitionTypeNamePrefix   = $DefinitionTypeNamePrefix
        }
        $ResolvedResult = Resolve-ReferenceParameterType @ResolveReferenceParameterType_params
        $paramType = $ResolvedResult.ParameterType
        if($ResolvedResult.ValidateSetString) {
            $ValidateSetString = $ResolvedResult.ValidateSetString
        }

        if((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-client-flatten') -and
           ($ParameterJsonObject.'x-ms-client-flatten'))
        {
            Set-TypeUsedAsClientFlatten -ReferenceTypeName $ReferenceTypeName -DefinitionFunctionsDetails $DefinitionFunctionsDetails
            
            # Assigning $null to $ReferenceTypeName so that this referenced definition is not set as UsedAsPathOperationInputType
            $ReferenceTypeName = $null
        }
    }
    else 
    {
        $paramType = 'object'
    }

    $paramType = Get-PSTypeFromSwaggerObject -ParameterType $paramType
    if ((Get-Member -InputObject $ParameterJsonObject -Name 'Enum') -and $ParameterJsonObject.Enum)
    {
        # AutoRest doesn't generate a parameter on Async method for the path operation 
        # when a parameter is required and has singly enum value.
        # Also, no enum type gets generated by AutoRest.
        if(($ParameterJsonObject.Enum.Count -eq 1) -and
           (Get-Member -InputObject $ParameterJsonObject -Name 'Required') -and 
           $ParameterJsonObject.Required -eq 'true')
        {
            $paramType = ""
        }
        elseif((Get-Member -InputObject $ParameterJsonObject -Name 'x-ms-enum') -and 
            $ParameterJsonObject.'x-ms-enum' -and 
            ($ParameterJsonObject.'x-ms-enum'.modelAsString -eq $false))
        {
            $paramType = $DefinitionTypeNamePrefix + (Get-CSharpModelName -Name $ParameterJsonObject.'x-ms-enum'.Name)
        }
        else
        {
            $ValidateSet = $ParameterJsonObject.Enum | ForEach-Object {$_ -replace "'","''"}
            $ValidateSetString = "'$($ValidateSet -join "', '")'"
        }
    }
    
    if ($ReferenceTypeName) {
        $ReferencedDefinitionDetails = @{}
        if($DefinitionFunctionsDetails.ContainsKey($ReferenceTypeName)) {
            $ReferencedDefinitionDetails = $DefinitionFunctionsDetails[$ReferenceTypeName]
        }
        $ReferencedDefinitionDetails['UsedAsPathOperationInputType'] = $true
    }

    if($paramType -and 
       (-not $paramType.Contains($DefinitionTypeNamePrefix)) -and
       ($null -eq ($paramType -as [Type])))
    {
        Write-Warning -Message ($LocalizedData.InvalidPathParameterType -f $paramType, $ParameterName)
    }

    return @{
        ParamType = $paramType
        ValidateSetString = $ValidateSetString
        IsParameter = $isParameter
        GlobalParameterDetails = $GlobalParameterDetails
    }
}

function Set-TypeUsedAsClientFlatten
{
    [CmdletBinding()]
	param
	(
        [Parameter(Mandatory=$true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionFunctionsDetails
	)

    $ReferencedFunctionDetails = @{}
    if($DefinitionFunctionsDetails.ContainsKey($ReferenceTypeName))
    {
        $ReferencedFunctionDetails = $DefinitionFunctionsDetails[$ReferenceTypeName]
    }
    else
    {
        $ReferencedFunctionDetails['Name'] = $ReferenceTypeName 
    }

    $ReferencedFunctionDetails['IsUsedAs_x_ms_client_flatten'] = $true

    $DefinitionFunctionsDetails[$ReferenceTypeName] = $ReferencedFunctionDetails
}

function Get-PSTypeFromSwaggerObject
{
    param(
        [Parameter(Mandatory=$false)]
        [AllowEmptyString()]
        [string]
        $ParameterType,

        [Parameter(Mandatory=$false)]
        [PSObject]
        $JsonObject
    )

    $ParameterType = Eval-Ts $tsSwaggerUtils "getPsTypeFromSwaggerObject" $ParameterType, $JsonObject

    return $ParameterType
}

function Get-SingularizedValue
{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name
    )

    $Name = Eval-Ts $tsSwaggerUtils "singularize" $Name

    return Get-PascalCasedString -Name $Name
}

function Get-PathCommandName
{
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory=$true)]
        [string]
        $OperationId
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    
    $res = Eval-Ts $tsSwaggerUtils "getPathCommandName" $OperationId
    return (ConvertTo-HashtableFromPsCustomObject $res)
}

function Test-OperationNameInDefinitionList
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name,

        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $SwaggerDict
    )

    return $SwaggerDict['Definitions'].ContainsKey($Name)
}

<#
.DESCRIPTION
    Utility function to get the parameter names declared in the Azure Resource Id (Endpoint path).
    
    Extraction logic follows the resource id guidelines provided by the Azure SDK team.
    - ResourceId should have Get, optionally other operations like Patch, Put and Delete, etc.,
    - Resource name parameter should be the last parameter in the endpoint path.

    This function also extracts the output type of Get operation, which will be used as the type of InputObject parameter.
    ResourceName return value will be used for generating alias value for Name parameter.
#>
function Get-AzureResourceIdParameters {
    param(
        [Parameter(Mandatory=$true)]
        [PSCustomObject]
        $JsonPathItemObject,

        [Parameter(Mandatory=$true)]
        [string]
        $ResourceId,
        
        [Parameter(Mandatory=$true)]
        [string]
        $NameSpace, 

        [Parameter(Mandatory=$true)]
        [string]
        $Models, 

        [Parameter(Mandatory=$true)]
        [hashtable]
        $DefinitionList
    )

    return Eval-Ts $tsSwaggerUtils "getAzureResourceIdParameters" $JsonPathItemObject, $ResourceId, $NameSpace, $Models, $DefinitionList
}

function Get-CSharpModelName
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Name
    )

    return (Eval-Ts $tsSwaggerUtils "getCSharpModelName" $Name)
}

<# Create an object from an external dependency with possible type name changes. Optionally resolve the external dependency using a delegate.
Input to $AssemblyResolver is $AssemblyName.
Doesn't support constructors with args currently. #>
function New-ObjectFromDependency {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]
        $TypeNames,

        [Parameter(Mandatory=$true)]
        [string]
        $AssemblyName,

        [Parameter(Mandatory=$false)]
        [System.Action[string]]
        $AssemblyResolver
    )

    if ($TypeNames.Count -gt 0) {
        $assemblyLoadAttempted = $false
        foreach ($typeName in $TypeNames) {
            if (-not ($typeName -as [Type])) {
                if (-not $assemblyLoadAttempted) {
                    if ($AssemblyResolver -ne $null) {
                        $AssemblyResolver.Invoke($AssemblyName)
                    } else {
                        $null = Add-Type -Path $AssemblyName
                    }

                    $assemblyLoadAttempted = $true
                }
            } else {
                return New-Object -TypeName $typeName
            }
        }
    }

    return $null
}

function Get-PowerShellCodeGenSettings {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $Path,

        [Parameter(Mandatory=$true)]
        [hashtable]
        $CodeGenSettings,

        [Parameter(Mandatory=$false)]
        [PSCustomObject]
        $PSMetaJsonObject
    )

    if($PSMetaJsonObject) {
        $swaggerObject = $PSMetaJsonObject
    }
    else {
        $swaggerObject = ConvertFrom-Json ((Get-Content $Path) -join [Environment]::NewLine) -ErrorAction Stop
    }
    if ((Get-Member -InputObject $swaggerObject -Name 'info') -and (Get-Member -InputObject $swaggerObject.'info' -Name 'x-ps-code-generation-settings')) {
        $props = Get-Member -InputObject $swaggerObject.'info'.'x-ps-code-generation-settings' -MemberType NoteProperty
        foreach ($prop in $props) {
            if (-not $CodeGenSettings.ContainsKey($prop.Name)) {                
                Write-Warning -Message ($LocalizedData.UnknownPSMetadataProperty -f ('x-ps-code-generation-settings', $prop.Name))
            } else {
                $CodeGenSettings[$prop.Name] = $swaggerObject.'info'.'x-ps-code-generation-settings'.$($prop.Name)
            }
        }
    }
}

function Resolve-ReferenceParameterType {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $ReferenceTypeName,

        [Parameter(Mandatory = $true)]
        [string]
        $DefinitionTypeNamePrefix,

        [Parameter(Mandatory = $true)]
        [PSCustomObject]
        $DefinitionFunctionsDetails
    )

    $ParameterType = $DefinitionTypeNamePrefix + $ReferenceTypeName
    $ValidateSet = $null
    $ValidateSetString = $null

    # Some referenced definitions can be non-models like enums with validateset.
    if ($DefinitionFunctionsDetails.ContainsKey($ReferenceTypeName) -and
        $DefinitionFunctionsDetails[$ReferenceTypeName].ContainsKey('Type') -and
        $DefinitionFunctionsDetails[$ReferenceTypeName].Type -and
        -not $DefinitionFunctionsDetails[$ReferenceTypeName].IsModel)
    {
        $ParameterType = $DefinitionFunctionsDetails[$ReferenceTypeName].Type
        
        if($DefinitionFunctionsDetails[$ReferenceTypeName].ValidateSet) {
            $ValidateSet = $DefinitionFunctionsDetails[$ReferenceTypeName].ValidateSet
            $ValidateSetString = "'$($ValidateSet -join "', '")'"
        }
    }

    return @{
        ParameterType     = $ParameterType
        ValidateSet       = $ValidateSet
        ValidateSetString = $ValidateSetString
    }
}