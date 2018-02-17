#########################################################################################
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
# Licensed under the MIT license.
#
# PSSwagger Module
#
#########################################################################################

$DynamicAssemblyGenerationBlock = @'
`$dllFullName = Join-Path -Path `$ClrPath -ChildPath '$DllFileName'
if(-not (Test-Path -Path `$dllFullName -PathType Leaf)) {
    . (Join-Path -Path `$PSScriptRoot -ChildPath 'AssemblyGenerationHelpers.ps1')
    New-SDKAssembly -AssemblyFileName '$DllFileName' -IsAzureSDK:`$$UseAzureCSharpGenerator
}
'@

$RootModuleContents = @'
Microsoft.PowerShell.Core\Set-StrictMode -Version Latest

# If the user supplied -Prefix to Import-Module, that applies to the nested module as well
# Force import the nested module again without -Prefix
if (-not (Get-Command Get-OperatingSystemInfo -Module PSSwaggerUtility -ErrorAction Ignore)) {
    # Simply doing "Import-Module PSSwaggerUtility" doesn't work for local case
	if (Test-Path -Path (Join-Path -Path `$PSScriptRoot -ChildPath PSSwaggerUtility)) {
		Import-Module (Join-Path -Path `$PSScriptRoot -ChildPath PSSwaggerUtility) -Force
	} else {
		Import-Module PSSwaggerUtility -Force
	}
}

if ((Get-OperatingSystemInfo).IsCore) {
    $testCoreModuleRequirements`$clr = 'coreclr'
}
else {
    $testFullModuleRequirements`$clr = 'fullclr'
}

`$ClrPath = Join-Path -Path `$PSScriptRoot -ChildPath 'ref' | Join-Path -ChildPath `$clr
$DynamicAssemblyGenerationCode
`$allDllsPath = Join-Path -Path `$ClrPath -ChildPath '*.dll'
if (Test-Path -Path `$ClrPath -PathType Container) {
    Get-ChildItem -Path `$allDllsPath -File | ForEach-Object { Add-Type -Path `$_.FullName -ErrorAction SilentlyContinue }
}

. (Join-Path -Path `$PSScriptRoot -ChildPath 'New-ServiceClient.ps1')
. (Join-Path -Path `$PSScriptRoot -ChildPath 'Get-TaskResult.ps1')
. (Join-Path -Path `$PSScriptRoot -ChildPath 'Get-ApplicableFilters.ps1')
. (Join-Path -Path `$PSScriptRoot -ChildPath 'Test-FilteredResult.ps1')
$(if($UseAzureCsharpGenerator) {
". (Join-Path -Path `$PSScriptRoot -ChildPath 'Get-ArmResourceIdParameterValue.ps1')"
})
`$allPs1FilesPath = Join-Path -Path `$PSScriptRoot -ChildPath '$GeneratedCommandsName' | Join-Path -ChildPath '*.ps1'
Get-ChildItem -Path `$allPs1FilesPath -Recurse -File | ForEach-Object { . `$_.FullName}
'@

$GeneratedCommandsName = 'Generated.PowerShell.Commands'

$DefaultGeneratedFileHeader = @'
Code generated by Microsoft (R) PSSwagger {0}
Changes may cause incorrect behavior and will be lost if the code is regenerated.
'@

$PSCommentFormatString = "<#
{0}
#>
"

$DefaultGeneratedFileHeaderWithoutVersion = @'
Code generated by Microsoft (R) PSSwagger
Changes may cause incorrect behavior and will be lost if the code is regenerated.
'@

$MicrosoftApacheLicenseHeader = @'
Copyright (c) Microsoft and contributors.  All rights reserved.

Licensed under the Apache License, Version 2.0 (the ""License"");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
'@

$MicrosoftMitLicenseHeader = @'
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License. See License.txt in the project root for license information.
'@
