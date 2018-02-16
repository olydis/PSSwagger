#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################

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
            $myPsObject | Get-Member -MemberType *Property | % { 
                $output.($_.name) = $myPsObject.($_.name); 
            } 
            $output; 
        } 
    } 
}

$tsTemplates = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")
$tsSwaggerUtils = [System.IO.File]::ReadAllText("$PSScriptRoot\SwaggerUtils.ts")

Microsoft.PowerShell.Core\Set-StrictMode -Version Latest
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath Utilities.psm1) -DisableNameChecking
Import-Module (Join-Path -Path $PSScriptRoot -ChildPath SwaggerUtils.psm1) -DisableNameChecking
. "$PSScriptRoot\PSSwagger.Constants.ps1" -Force
. "$PSScriptRoot\Eval-Ts.ps1" -Force
Microsoft.PowerShell.Utility\Import-LocalizedData  LocalizedData -filename PSSwagger.Resources.psd1

function Get-SwaggerSpecPathInfo {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [PSObject]
        $JsonPathItemObject,

        [Parameter(Mandatory = $true)]
        [PSCustomObject] 
        $PathFunctionDetails,

        [Parameter(Mandatory = $true)]
        [hashTable]
        $swaggerDict,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $SwaggerMetaDict,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $DefinitionFunctionsDetails,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $ParameterGroupCache,

        [Parameter(Mandatory = $false)]
        [PSCustomObject]
        $PSMetaJsonObject
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState
    $UseAzureCsharpGenerator = $SwaggerMetaDict['UseAzureCsharpGenerator']
    $EndpointRelativePath = $JsonPathItemObject.Name

    $PSMetaPathJsonObject = $null
    if ($PSMetaJsonObject) {
        if ((Get-Member -InputObject $PSMetaJsonObject -Name 'paths') -and (Get-Member -InputObject $PSMetaJsonObject.paths -Name $EndpointRelativePath)) {
            $PSMetaPathJsonObject = $PSMetaJsonObject.paths.$EndpointRelativePath
        }
        elseif ((Get-Member -InputObject $PSMetaJsonObject -Name 'x-ms-paths') -and (Get-Member -InputObject $PSMetaJsonObject.'x-ms-paths' -Name $EndpointRelativePath)) {
            $PSMetaPathJsonObject = $PSMetaJsonObject.'x-ms-paths'.$EndpointRelativePath
        }
    }

    # First get path level common parameters, if any, which will be common to all operations in this swagger path.
    $PathCommonParameters = @{}
    if (Get-Member -InputObject $JsonPathItemObject.value -Name 'Parameters') {
        $PSMetaParametersJsonObject = $null
        if ($PSMetaPathJsonObject -and (Get-Member -InputObject $PSMetaPathJsonObject -Name 'parameters')) {
            $PSMetaParametersJsonObject = $PSMetaPathJsonObject.'parameters'
        }

        $GetPathParamInfo_params = @{
            JsonPathItemObject         = $JsonPathItemObject.Value
            SwaggerDict                = $swaggerDict
            DefinitionFunctionsDetails = $DefinitionFunctionsDetails
            ParameterGroupCache        = $ParameterGroupCache
            ParametersTable            = $PathCommonParameters
            PSMetaParametersJsonObject = $PSMetaParametersJsonObject
        }
        Get-PathParamInfo @GetPathParamInfo_params
    }

    $ResourceIdAndInputObjectDetails = $null
    if ($UseAzureCsharpGenerator) {
        $GetResourceIdParameters_params = @{
            JsonPathItemObject = $JsonPathItemObject
            ResourceId         = $EndpointRelativePath
            Namespace          = $SwaggerDict['Info'].NameSpace
            Models             = $SwaggerDict['Info'].Models
            DefinitionList     = $swaggerDict['Definitions']
        }
        $ResourceIdAndInputObjectDetails = Get-AzureResourceIdParameters @GetResourceIdParameters_params
    }

    $JsonPathItemObject.value.PSObject.Properties | ForEach-Object {
        $longRunningOperation = $false
        $operationType = $_.Name
        if (((Get-Member -InputObject $_.Value -Name 'x-ms-long-running-operation') -and $_.Value.'x-ms-long-running-operation')) {
            $longRunningOperation = $true
        }

        $x_ms_pageableObject = $null
        if (((Get-Member -InputObject $_.Value -Name 'x-ms-pageable') -and $_.Value.'x-ms-pageable')) {
            $x_ms_pageableObject = @{}
            if (((Get-Member -InputObject $_.Value.'x-ms-pageable' -Name 'operationName') -and $_.Value.'x-ms-pageable'.'operationName')) {
                $x_ms_pageableObject['operationName'] = $_.Value.'x-ms-pageable'.'operationName'
            }

            if (((Get-Member -InputObject $_.Value.'x-ms-pageable' -Name 'itemName') -and $_.Value.'x-ms-pageable'.'itemName')) {
                $x_ms_pageableObject['itemName'] = $_.Value.'x-ms-pageable'.'itemName'
            }

            if ((Get-Member -InputObject $_.Value.'x-ms-pageable' -Name 'nextLinkName')) {
                if ($_.Value.'x-ms-pageable'.'nextLinkName') {
                    $x_ms_pageableObject['nextLinkName'] = $_.Value.'x-ms-pageable'.'nextLinkName'
                }
                else {
                    $x_ms_pageableObject = $null
                }
            }
        }

        if (Get-Member -InputObject $_.Value -Name 'security') {
            $operationSecurityObject = $_.Value.'security'
        }
        elseif ($swaggerDict.ContainsKey('Security')) {
            $operationSecurityObject = $swaggerDict['Security']
        }
        else {
            $operationSecurityObject = $null
        }

        $cmdletInfoOverrides = @()
        $PSMetaOperationJsonObject = $null
        if ($PSMetaPathJsonObject -and
            (Get-Member -InputObject $PSMetaPathJsonObject -Name $operationType)) {
            $PSMetaOperationJsonObject = $PSMetaPathJsonObject.$operationType
        }

        if (Get-Member -InputObject $_.Value -Name 'OperationId') {
            $operationId = $_.Value.operationId
            Write-Verbose -Message ($LocalizedData.GettingSwaggerSpecPathInfo -f $operationId)

            $defaultCommandNames = Get-PathCommandName -OperationId $operationId
            if ($PSMetaOperationJsonObject -and
                (Get-Member -InputObject $PSMetaOperationJsonObject -Name 'x-ps-cmdlet-infos')) {
                $PSMetaOperationJsonObject.'x-ps-cmdlet-infos' | ForEach-Object {
                    $metadataName = $null
                    if (Get-Member -InputObject $_ -Name 'name') {
                        $metadataName = $_.name
                    }

                    $cmdletInfoOverride = @{
                        Name     = $metadataName
                        Metadata = $_
                    }

                    # If no name override is specified, apply all these overrides to each default command name
                    if (-not $metadataName) {
                        foreach ($defaultCommandName in $defaultCommandNames) {
                            $cmdletInfoOverrides += @{
                                Name     = $defaultCommandName.name
                                Metadata = $cmdletInfoOverride.Metadata
                            }
                        }
                    }
                    else {
                        $cmdletInfoOverrides += $cmdletInfoOverride
                    }
                }
            }
            elseif ((Get-Member -InputObject $_.Value -Name 'x-ps-cmdlet-infos') -and $_.Value.'x-ps-cmdlet-infos') {
                foreach ($cmdletMetadata in $_.Value.'x-ps-cmdlet-infos') {
                    $cmdletInfoOverride = @{
                        Metadata = $cmdletMetadata
                    }
                    if ((Get-Member -InputObject $cmdletMetadata -Name 'name') -and $cmdletMetadata.name) {
                        $cmdletInfoOverride['name'] = $cmdletMetadata.name
                    }

                    # If no name override is specified, apply all these overrides to each default command name
                    if (-not (Get-Member -InputObject $cmdletMetadata -Name 'name')) {
                        foreach ($defaultCommandName in $defaultCommandNames) {
                            $cmdletInfoOverrides += @{
                                Name     = $defaultCommandName.name
                                Metadata = $cmdletInfoOverride.Metadata
                            }
                        }
                    }
                    else {
                        $cmdletInfoOverrides += $cmdletInfoOverride
                    }
                }
            }

            $FunctionDescription = ""
            if ((Get-Member -InputObject $_.value -Name 'description') -and $_.value.description) {
                $FunctionDescription = $_.value.description 
            }

            $FunctionSynopsis = ''
            if ((Get-Member -InputObject $_.value -Name 'Summary') -and $_.value.Summary) {
                $FunctionSynopsis = $_.value.Summary 
            }
            
            $ParametersTable = @{}
            # Add Path common parameters to the operation's parameters list.
            $PathCommonParameters.GetEnumerator() | ForEach-Object {
                # Cloning the common parameters object so that some values can be updated.
                $PathCommonParamDetails = $_.Value.Clone()
                if ($PathCommonParamDetails.ContainsKey('OriginalParameterName') -and $PathCommonParamDetails.OriginalParameterName) {
                    $PathCommonParamDetails['OriginalParameterName'] = ''
                }
                $ParametersTable[$_.Key] = $PathCommonParamDetails
            }

            $PSMetaParametersJsonObject = $null
            if ($PSMetaOperationJsonObject -and (Get-Member -InputObject $PSMetaOperationJsonObject -Name 'parameters')) {
                $PSMetaParametersJsonObject = $PSMetaOperationJsonObject.'parameters'
            }

            $GetPathParamInfo_params2 = @{
                JsonPathItemObject         = $_.value
                SwaggerDict                = $swaggerDict
                DefinitionFunctionsDetails = $DefinitionFunctionsDetails
                ParameterGroupCache        = $ParameterGroupCache
                ParametersTable            = $ParametersTable
                PSMetaParametersJsonObject = $PSMetaParametersJsonObject
            }
            Get-PathParamInfo @GetPathParamInfo_params2

            $responses = ""
            if ((Get-Member -InputObject $_.value -Name 'responses') -and $_.value.responses) {
                $responses = $_.value.responses 
            }

            if ($cmdletInfoOverrides) {
                $commandNames = $cmdletInfoOverrides
            }
            else {
                $commandNames = Get-PathCommandName -OperationId $operationId
            }
            
            # Priority of a parameterset will be used to determine the default parameterset of a cmdlet.
            $Priority = 0
            $ParametersCount = Get-HashtableKeyCount -Hashtable $ParametersTable
            if ($ParametersCount) {
                # Priority for parameter sets with mandatory parameters starts at 100
                $Priority = 100

                # Get Name parameter details, if exists.
                # If Name parameter is already available, ResourceName parameter name will not be changed.
                $NameParameterDetails = $ParametersTable.GetEnumerator() | Foreach-Object {
                    if ($_.Value.Name -eq 'Name') {
                        $_.Value
                    }
                }
                    
                $ParametersTable.GetEnumerator() | ForEach-Object {
                    if ($_.Value.ContainsKey('Mandatory') -and $_.Value.Mandatory -eq '$true') {
                        $Priority++
                    }

                    # Add alias for the resource name parameter.
                    if ($ResourceIdAndInputObjectDetails -and
                        -not $NameParameterDetails -and
                        ($_.Value.Name -ne 'Name') -and
                        ($_.Value.Name -eq $ResourceIdAndInputObjectDetails.ResourceName)) {
                        $_.Value['Alias'] = 'Name'
                    }
                }

                # If there are no mandatory parameters, use the parameter count as the priority.                
                if ($Priority -eq 100) {
                    $Priority = $ParametersCount
                }
            }

            $ParameterSetDetail = @{
                Description          = $FunctionDescription
                Synopsis             = $FunctionSynopsis
                ParameterDetails     = $ParametersTable
                Responses            = $responses
                ParameterSetName     = $operationId
                OperationId          = $operationId
                OperationType        = $operationType
                EndpointRelativePath = $EndpointRelativePath
                PathCommonParameters = $PathCommonParameters
                Priority             = $Priority
                'x-ms-pageable'      = $x_ms_pageableObject
            }

            if ((Get-Member -InputObject $_.Value -Name 'x-ms-odata') -and $_.Value.'x-ms-odata') {
                # Currently only the existence of this property is really important, but might as well save the value
                $ParameterSetDetail.'x-ms-odata' = $_.Value.'x-ms-odata'
            }

            # There's probably a better way to do this...
            $opIdValues = $operationId -split "_", 2
            if (-not $opIdValues -or ($opIdValues.Count -ne 2)) {
                $approximateVerb = $operationId
            }
            else {
                $approximateVerb = $opIdValues[1]
                if ((-not $UseAzureCsharpGenerator) -and 
                    (Test-OperationNameInDefinitionList -Name $opIdValues[0] -SwaggerDict $swaggerDict)) { 
                    $ParameterSetDetail['UseOperationsSuffix'] = $true
                }
            }
            
            $InputObjectParameterSetDetail = $null
            $ResourceIdParameterSetDetail = $null
            if ($ResourceIdAndInputObjectDetails) {
                # InputObject parameterset
                $InputObjectParameterDetails = @{
                    Name                  = 'InputObject'
                    Type                  = $ResourceIdAndInputObjectDetails.InputObjectParameterType
                    ValidateSet           = ''
                    Mandatory             = '$true'
                    Description           = "The input object of type $($ResourceIdAndInputObjectDetails.InputObjectParameterType)."
                    IsParameter           = $true
                    OriginalParameterName = 'InputObject'
                    FlattenOnPSCmdlet     = $false
                    ValueFromPipeline     = $true
                }
                $InputObjectParamSetParameterDetails = @{ 0 = $InputObjectParameterDetails }
                $index = 1
                $ClonedParameterSetDetail = $ParameterSetDetail.Clone()
                $ClonedParameterSetDetail.ParameterDetails.GetEnumerator() | ForEach-Object {
                    $paramDetails = $_.Value
                    if ($ResourceIdAndInputObjectDetails.ResourceIdParameters -notcontains $paramDetails.Name) {
                        $InputObjectParamSetParameterDetails[$index++] = $paramDetails
                    }
                }
                $ClonedParameterSetDetail.ParameterDetails = $InputObjectParamSetParameterDetails
                $ClonedParameterSetDetail.Priority += 1
                $ClonedParameterSetDetail.ParameterSetName = "InputObject_$($ClonedParameterSetDetail.ParameterSetName)"
                $InputObjectParameterSetDetail = $ClonedParameterSetDetail

                # ResourceId parameterset
                $ResourceIdParameterDetails = @{
                    Name                            = 'ResourceId'
                    Type                            = 'System.String'
                    ValidateSet                     = ''
                    Mandatory                       = '$true'
                    Description                     = 'The resource id.'
                    IsParameter                     = $true
                    OriginalParameterName           = 'ResourceId'
                    FlattenOnPSCmdlet               = $false
                    ValueFromPipelineByPropertyName = $true
                }
                $ResourceIdParamSetParameterDetails = @{ 0 = $ResourceIdParameterDetails }
                $index = 1
                $ClonedParameterSetDetail = $ParameterSetDetail.Clone()
                $ClonedParameterSetDetail.ParameterDetails.GetEnumerator() | ForEach-Object {
                    $paramDetails = $_.Value
                    if ($ResourceIdAndInputObjectDetails.ResourceIdParameters -notcontains $paramDetails.Name) {
                        $ResourceIdParamSetParameterDetails[$index++] = $paramDetails
                    }
                }
                $ClonedParameterSetDetail.ParameterDetails = $ResourceIdParamSetParameterDetails
                $ClonedParameterSetDetail.Priority += 2
                $ClonedParameterSetDetail.ParameterSetName = "ResourceId_$($ClonedParameterSetDetail.ParameterSetName)"
                $ResourceIdParameterSetDetail = $ClonedParameterSetDetail

                $ParameterSetDetail['ClonedParameterSetNames'] = @(
                    "InputObject_$($ParameterSetDetail.ParameterSetName)",
                    "ResourceId_$($ParameterSetDetail.ParameterSetName)"
                )
                $ParameterSetDetail['ResourceIdParameters'] = $ResourceIdAndInputObjectDetails.ResourceIdParameters
            }

            $commandNames | ForEach-Object {
                $FunctionDetails = @{}
                if ($PathFunctionDetails.ContainsKey($_.name)) {
                    $FunctionDetails = $PathFunctionDetails[$_.name]
                }
                else {
                    $FunctionDetails['CommandName'] = $_.name
                    $FunctionDetails['x-ms-long-running-operation'] = $longRunningOperation
                }

                if ($_.ContainsKey('Metadata') -and (-not $FunctionDetails.ContainsKey("Metadata"))) {
                    $FunctionDetails['Metadata'] = $_.Metadata
                }

                if ($operationSecurityObject) {
                    $FunctionDetails['Security'] = $operationSecurityObject
                }

                $ParameterSetDetails = @()
                if ($FunctionDetails.ContainsKey('ParameterSetDetails')) {
                    $ParameterSetDetails = $FunctionDetails['ParameterSetDetails']
                } 

                $ParameterSetDetails += $ParameterSetDetail
                if ($InputObjectParameterSetDetail) {
                    $ParameterSetDetails += $InputObjectParameterSetDetail
                }
                if ($ResourceIdParameterSetDetail) {
                    $ParameterSetDetails += $ResourceIdParameterSetDetail
                }
    
                $FunctionDetails['ParameterSetDetails'] = $ParameterSetDetails
                $PathFunctionDetails[$_.name] = $FunctionDetails
            }
        }
        elseif (-not ((Get-Member -InputObject $_ -Name 'Name') -and ($_.Name -eq 'Parameters'))) {
            $Message = $LocalizedData.UnsupportedSwaggerProperties -f ('JsonPathItemObject', $($_.Value | Out-String))
            Write-Warning -Message $Message
        }
    }
}

<# Mark any operations as paging operations if they're the target of any operation's x-ms-pageable.operationName property.
These operations will not generate -Page and -Paging, even though they're marked as pageable.
These are single page operations and should never be unrolled (in the case of -not -Paging) or accept IPage parameters (in the case of -Page) #>
function Preprocess-PagingOperations {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]
        $PathFunctionDetails
    )

    $PathFunctionDetails.GetEnumerator() | ForEach-Object {
        $_.Value.ParameterSetDetails | ForEach-Object {
            $parameterSetDetail = $_
            if ($parameterSetDetail.ContainsKey('x-ms-pageable') -and $parameterSetDetail.'x-ms-pageable') {
                if ($parameterSetDetail.'x-ms-pageable'.ContainsKey('operationName')) {
                    $matchingPath = $PathFunctionDetails.GetEnumerator() | Where-Object { $_.Value.ParameterSetDetails | Where-Object { $_.OperationId -eq $parameterSetDetail.'x-ms-pageable'.'operationName'} } | Select-Object -First 1
                    $matchingPath.Value['IsNextPageOperation'] = $true
                }
            }
        }
    }
}

function Add-UniqueParameter {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [hashtable]
        $ParameterDetails,
        
        [Parameter(Mandatory = $true)]
        [hashtable]
        $CandidateParameterDetails,

        [Parameter(Mandatory = $true)]
        [string]
        $ParameterSetName,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $ParametersToAdd,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $ParameterHitCount
    )

    Get-CallerPreference -Cmdlet $PSCmdlet -SessionState $ExecutionContext.SessionState

    $parameterName = $CandidateParameterDetails.Name
    if ($parameterDetails.IsParameter) {
        if (-not $parameterHitCount.ContainsKey($parameterName)) {
            $parameterHitCount[$parameterName] = 0
        }

        $parameterHitCount[$parameterName]++
        if (-not ($parametersToAdd.ContainsKey($parameterName))) {
            $parametersToAdd[$parameterName] = @{
                # We can grab details like Type, Name, ValidateSet from any of the parameter definitions
                Details          = $CandidateParameterDetails
                ParameterSetInfo = @{$ParameterSetName = @{
                        Name      = $ParameterSetName
                        Mandatory = $CandidateParameterDetails.Mandatory
                    }
                }
            }
        }
        else {
            $parametersToAdd[$parameterName].ParameterSetInfo[$ParameterSetName] = @{
                Name      = $ParameterSetName
                Mandatory = $CandidateParameterDetails.Mandatory
            }
        }
    }
}

function Set-ExtendedCodeMetadata {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [string]
        $MainClientTypeName,

        [Parameter(Mandatory = $true)]
        [string]
        $CliXmlTmpPath
    )

    $resultRecord = @{
        VerboseMessages = @()
        ErrorMessages   = @()
        WarningMessages = @()
    }
    
    $resultRecord.VerboseMessages += $LocalizedData.ExtractingMetadata

    $PathFunctionDetails = Import-CliXml -Path $CliXmlTmpPath
    $errorOccurred = $false
    $PathFunctionDetails.GetEnumerator() | ForEach-Object {
        $FunctionDetails = $_.Value
        $ParameterSetDetails = $FunctionDetails['ParameterSetDetails']
        foreach ($parameterSetDetail in $ParameterSetDetails) {
            if ($errorOccurred) {
                return
            }
            
            $operationId = $parameterSetDetail.OperationId
            $methodNames = @()
            $operations = ''
            $operationsWithSuffix = ''
            $opIdValues = $operationId -split '_', 2 
            if (-not $opIdValues -or ($opIdValues.count -ne 2)) {
                # I'm sure there's other stuff but what? Need to check what AutoRest is using. Their CSharpNamer thing?
                $methodNames += $operationId.Replace("-", "") + 'WithHttpMessagesAsync'
                $methodNames += $operationId.Replace("-", "") + 'Method' + 'WithHttpMessagesAsync'
            }
            else {            
                $operationName = $opIdValues[0].Replace("-", "")
                $operationType = $opIdValues[1].Replace("-", "")
                $operations = ".$operationName"
                if ($parameterSetDetail['UseOperationsSuffix'] -and $parameterSetDetail['UseOperationsSuffix']) { 
                    $operationsWithSuffix = $operations + 'Operations'
                }

                $methodNames += $operationType + 'WithHttpMessagesAsync'
                # When OperationType value conflicts with a definition name, AutoREST generates method name by adding Method to the OperationType.
                $methodNames += $operationType + 'Method' + 'WithHttpMessagesAsync'
            }

            $parameterSetDetail['Operations'] = $operations

            # For some reason, moving this out of this loop causes issues
            $clientType = $MainClientTypeName -as [Type]
            if (-not $clientType) {
                $resultRecord.ErrorMessages += $LocalizedData.ExpectedServiceClientTypeNotFound -f ($MainClientTypeName)
                Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
                $errorOccurred = $true
                return
            }

            # Process global parameters
            $paramObject = $parameterSetDetail.ParameterDetails
            $clientType.GetProperties() | ForEach-Object {
                $propertyName = $_.Name
                $matchingParamDetail = $paramObject.GetEnumerator() | Where-Object { $_.Value.Name -eq $propertyName } | Select-Object -First 1 -ErrorAction Ignore
                if ($matchingParamDetail) {
                    $setSingleParameterMetadataParms = @{
                        CommandName         = $FunctionDetails['CommandName']
                        Name                = $matchingParamDetail.Value.Name
                        HasDefaultValue     = $false
                        IsGrouped           = $false
                        Type                = $_.PropertyType
                        MatchingParamDetail = $matchingParamDetail.Value
                        ResultRecord        = $resultRecord
                    }
                    if (-not (Set-SingleParameterMetadata @setSingleParameterMetadataParms)) {
                        Export-CliXml -InputObject $ResultRecord -Path $CliXmlTmpPath
                        $errorOccurred = $true
                        return
                    }
                }
            }

            if ($operationsWithSuffix) {
                $operationName = $operationsWithSuffix.Substring(1)
                $propertyObject = $clientType.GetProperties() | Where-Object { $_.Name -eq $operationName } | Select-Object -First 1 -ErrorAction Ignore
                if (-not $propertyObject) {
                    # The Operations suffix logic isn't rock solid, so this is safety check.
                    $operationName = $operations.Substring(1)
                    $propertyObject = $clientType.GetProperties() | Where-Object { $_.Name -eq $operationName } | Select-Object -First 1 -ErrorAction Ignore
                    if (-not $propertyObject) {
                        $resultRecord.ErrorMessages += $LocalizedData.ExpectedOperationsClientTypeNotFound -f ($operationName, $clientType)
                        Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
                        $errorOccurred = $true
                        return
                    }
                }
                else {
                    $parameterSetDetail['Operations'] = $operationsWithSuffix
                }

                $clientType = $propertyObject.PropertyType
            }
            elseif ($operations) {
                $operationName = $operations.Substring(1)
                $propertyObject = $clientType.GetProperties() | Where-Object { $_.Name -eq $operationName } | Select-Object -First 1 -ErrorAction Ignore
                if (-not $propertyObject) {
                    $resultRecord.ErrorMessages += $LocalizedData.ExpectedOperationsClientTypeNotFound -f ($operationName, $clientType)
                    Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
                    $errorOccurred = $true
                    return
                }

                $clientType = $propertyObject.PropertyType
            }

            $methodInfo = $clientType.GetMethods() | Where-Object {$MethodNames -contains $_.Name} | Select-Object -First 1
            if (-not $methodInfo) {
                $resultRecord.ErrorMessages += $LocalizedData.ExpectedMethodOnTypeNotFound -f (($MethodNames -join ', or '), $clientType)
                Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
                $errorOccurred = $true
                return
            }
            $parameterSetDetail['MethodName'] = $methodInfo.Name

            # Process output type
            $returnType = $methodInfo.ReturnType
            if ($returnType.Name -eq 'Task`1') {
                $returnType = $returnType.GenericTypeArguments[0]
            }

            if ($returnType.Name -eq 'AzureOperationResponse`1') {
                $returnType = $returnType.GenericTypeArguments[0]
            }

            # Note: ReturnType and PSCmdletOutputItemType are currently used for Swagger operations which supports x-ms-pageable.
            if (($returnType.Name -eq 'IPage`1') -and $returnType.GenericTypeArguments) {
                $PSCmdletOutputItemTypeString = Convert-GenericTypeToString -Type $returnType.GenericTypeArguments[0]
                $parameterSetDetail['PSCmdletOutputItemType'] = $PSCmdletOutputItemTypeString.Trim('[]')
            }
            $parameterSetDetail['ReturnType'] = Convert-GenericTypeToString -Type $returnType

            $ParamList = @()
            $oDataQueryFound = $false
            $methodInfo.GetParameters() | Sort-Object -Property Position | ForEach-Object {
                $hasDefaultValue = $_.HasDefaultValue
                # All Types should be converted to their string names, otherwise the CLI XML gets too large
                $type = $_.ParameterType.ToString()
                $metadata = @{
                    Name            = Get-PascalCasedString -Name $_.Name
                    HasDefaultValue = $hasDefaultValue
                    Type            = $type
                }

                $matchingParamDetail = $paramObject.GetEnumerator() | Where-Object { $_.Value.Name -eq $metadata.Name } | Select-Object -First 1 -ErrorAction Ignore
                if ($matchingParamDetail) {
                    # Not all parameters in the code is present in the Swagger spec (autogenerated parameters like CustomHeaders or ODataQuery parameters)
                    $matchingParamDetail = $matchingParamDetail[0].Value
                    if ($matchingParamDetail.ContainsKey('x_ms_parameter_grouping_group')) {
                        # Look through this parameter group's parameters and extract the individual metadata
                        $paramToAdd = "`$$($matchingParamDetail.Name)"
                        $parameterGroupType = $_.ParameterType
                        $parameterGroupType.GetProperties() | ForEach-Object {
                            $parameterGroupProperty = $_
                            $matchingGroupedParameterDetailEntry = $matchingParamDetail.'x_ms_parameter_grouping_group'.GetEnumerator() | Where-Object { $_.Value.Name -eq $parameterGroupProperty.Name } | Select-Object -First 1 -ErrorAction Ignore
                            if ($matchingGroupedParameterDetailEntry) {
                                $setSingleParameterMetadataParms = @{
                                    CommandName         = $FunctionDetails['CommandName']
                                    Name                = $matchingParamDetail.Name
                                    HasDefaultValue     = $false
                                    IsGrouped           = $true
                                    Type                = $_.PropertyType
                                    MatchingParamDetail = $matchingGroupedParameterDetailEntry.Value
                                    ResultRecord        = $resultRecord
                                }

                                if (-not (Set-SingleParameterMetadata @setSingleParameterMetadataParms)) {
                                    Export-CliXml -InputObject $ResultRecord -Path $CliXmlTmpPath
                                    $errorOccurred = $true
                                    return
                                }

                                $matchingGroupedParameterDetailEntry.Value.ExtendedData.GroupType = $parameterGroupType.ToString()
                            }
                        }
                    }
                    else {
                        # Single parameter
                        $setSingleParameterMetadataParms = @{
                            CommandName         = $FunctionDetails['CommandName']
                            Name                = $_.Name
                            HasDefaultValue     = $hasDefaultValue
                            IsGrouped           = $false
                            Type                = $_.ParameterType
                            MatchingParamDetail = $matchingParamDetail
                            ResultRecord        = $resultRecord
                        }

                        if ($hasDefaultValue) {
                            $setSingleParameterMetadataParms['DefaultValue'] = $_.DefaultValue
                        }

                        if (-not (Set-SingleParameterMetadata @setSingleParameterMetadataParms)) {
                            Export-CliXml -InputObject $ResultRecord -Path $CliXmlTmpPath
                            $errorOccurred = $true
                            return
                        }

                        $paramToAdd = $matchingParamDetail.ExtendedData.ParamToAdd
                    }
                    
                    $ParamList += $paramToAdd
                }
                else {
                    if ($metadata.Type.StartsWith("Microsoft.Rest.Azure.OData.ODataQuery``1")) {
                        if ($oDataQueryFound) {
                            $resultRecord.ErrorMessages += ($LocalizedData.MultipleODataQueriesOneFunction -f ($operationId))
                            Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
                            return
                        }
                        else {
                            # Escape backticks
                            $oDataQueryType = $metadata.Type.Replace("``", "````")
                            $ParamList += "`$(if (`$oDataQuery) { New-Object -TypeName `"$oDataQueryType`" -ArgumentList `$oDataQuery } else { `$null })"
                            $oDataQueryFound = $true
                        }
                    }
                }
            }
            
            if ($parameterSetDetail.ContainsKey('x-ms-odata') -and $parameterSetDetail.'x-ms-odata') {
                $paramObject.GetEnumerator() | ForEach-Object {
                    $paramDetail = $_.Value
                    if (-not $paramDetail.ContainsKey('ExtendedData')) {
                        $metadata = @{
                            IsODataParameter = $true
                        }

                        $paramDetail.ExtendedData = $metadata
                    }
                }
            }

            $parameterSetDetail['ExpandedParamList'] = $ParamList -Join ", "
        }

        if ($errorOccurred) {
            return
        }
    }

    $resultRecord.Result = $PathFunctionDetails
    Export-CliXml -InputObject $resultRecord -Path $CliXmlTmpPath
}

function Convert-GenericTypeToString {
    param(
        [Parameter(Mandatory = $true)]
        [Type]$Type
    )

    if (-not $Type.IsGenericType) {
        return $Type.FullName
    }

    $genericTypeStr = ''
    foreach ($genericTypeArg in $Type.GenericTypeArguments) {
        $genericTypeStr += "$(Convert-GenericTypeToString -Type $genericTypeArg),"
    }

    $genericTypeStr = $genericTypeStr.Substring(0, $genericTypeStr.Length - 1)
    return "$($Type.FullName.Substring(0, $Type.FullName.IndexOf('`')))[$genericTypeStr]"
}

function Set-SingleParameterMetadata {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $CommandName,

        [Parameter(Mandatory = $true)]
        [string]
        $Name,

        [Parameter(Mandatory = $true)]
        [bool]
        $HasDefaultValue,

        [Parameter(Mandatory = $true)]
        [bool]
        $IsGrouped,

        [Parameter(Mandatory = $true)]
        [System.Type]
        $Type,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $MatchingParamDetail,

        [Parameter(Mandatory = $true)]
        [hashtable]
        $ResultRecord,

        [Parameter(Mandatory = $false)]
        [object]
        $DefaultValue
    )
    
    $name = Get-PascalCasedString -Name $_.Name
    $metadata = @{
        Name            = $name
        HasDefaultValue = $HasDefaultValue
        Type            = $Type.ToString()
        ParamToAdd      = "`$$name"
    }

    if ($HasDefaultValue) {
        # Setting this default value actually matter, but we might as well
        if ("System.String" -eq $metadata.Type) {
            if ($DefaultValue -eq $null) {
                $metadata.HasDefaultValue = $false
                # This is the part that works around PS automatic string coercion
                $metadata.ParamToAdd = "`$(if (`$PSBoundParameters.ContainsKey('$($metadata.Name)')) { $($metadata.ParamToAdd) } else { [NullString]::Value })"
            }
        }
        elseif ("System.Nullable``1[System.Boolean]" -eq $metadata.Type) {
            if ($DefaultValue -ne $null) {
                $DefaultValue = "`$$DefaultValue"
            }

            $metadata.Type = "switch"
        }
        else {
            $DefaultValue = $_.DefaultValue
            if (-not ($_.ParameterType.IsValueType) -and $DefaultValue) {
                $ResultRecord.ErrorMessages += $LocalizedData.ReferenceTypeDefaultValueNotSupported -f ($metadata.Name, $metadata.Type, $CommandName)
                return $false
            }
        }

        $metadata['DefaultValue'] = $DefaultValue
    }
    else {
        if ('$false' -eq $matchingParamDetail.Mandatory -and (-not $IsGrouped)) {
            # This happens in the case of optional path parameters, even if the path parameter is at the end
            $ResultRecord.WarningMessages += ($LocalizedData.OptionalParameterNowRequired -f ($metadata.Name, $CommandName))
        }
    }

    $MatchingParamDetail['ExtendedData'] = $metadata
    return $true
}

function Get-TemporaryCliXmlFilePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]
        $FullClientTypeName
    )

    $random = [Guid]::NewGuid().Guid
    $filePath = Join-Path -Path (Get-XDGDirectory -DirectoryType Cache) -ChildPath "$FullClientTypeName.$random.xml"
    return $filePath
}
<#
.SYNOPSIS
 Convert an object into a string to represents the value in PowerShell

.EXAMPLE
[string]this is a string => 'this is a string'
[bool]true => $true
[int]5 => 5
#>
function Get-ValueText {
    param(
        [Parameter(Mandatory = $true)]
        [object]
        $obj
    )

    if ($obj -is [string]) {
        return "'$obj'"
    }
    elseif ($obj -is [bool]) {
        return "`$$obj"
    }
    else {
        return $obj
    }
}