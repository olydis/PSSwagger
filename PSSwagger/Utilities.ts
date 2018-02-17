
function removeSpecialCharacter(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

function getPascalCasedString(name: string): string {
  if (name) {
    name = removeSpecialCharacter(name);
    return name.charAt(0).toUpperCase() + name.substr(1);
  }
  return undefined;
}

// generates a cmdlet for the definition
function newSwaggerSpecDefinitionCommand(functionDetails: any, generatedCommandsPath: string, modelsNamespace: string, psHeaderComment: string) {
  const commandName = `New-${functionDetails.Name}Object`
  const commandHelp = helpDescStr(functionDetails.synopsis, functionDetails.description);

  let paramHelp = "";
  let paramblock = "";
  let body = "";
  let DefinitionTypeNamePrefix = modelsNamespace + ".";
  let ParameterSetPropertyString = "";
  let ValueFromPipelineString = '';
  let ValueFromPipelineByPropertyNameString = '';
  let parameterDefaultValueOption = "";

  for (const ParameterDetails of Object.values(functionDetails.ParametersTable)) {
    if (!ParameterDetails.Discriminator) {
      const parameterName = ParameterDetails.Name;
      const paramType = `[${ParameterDetails.Type}]\r\n        `;
      const AllParameterSetsString = parameterAttributeString(ParameterDetails.Mandatory, ValueFromPipelineByPropertyNameString, ValueFromPipelineString, ParameterSetPropertyString);
      let ValidateSetDefinition = null;
      if (ParameterDetails.ValidateSet) {
        ValidateSetDefinition = validateSetDefinitionString(ParameterDetails.ValidateSet);
      }
      let ParameterAliasAttribute = null
      paramblock += parameterDefString(AllParameterSetsString, null, ValidateSetDefinition, paramType, "$" + parameterName, parameterDefaultValueOption);

      paramHelp += helpParamStr(parameterName, ParameterDetails.Description);
    }

  }
  paramblock = paramblock.replace(/[\s,]*$/, "");


  const commandString = advFnSignatureForDefintion(commandHelp, paramHelp, commandName, paramblock, createObjectStr(DefinitionTypeNamePrefix + functionDetails.Name));

  const commandFilePath = `${generatedCommandsPath}/${commandName}.ps1`;
  CreateDirectoryFor(commandFilePath);
  writeFileSync(commandFilePath, getFormattedFunctionContent(psHeaderComment + commandString));
  logVerbose(`Generated command '${commandName}' for the definition name '${functionDetails.Name}'.`);
  return commandName;
}

function newSwaggerDefinitionFormatFile(functionDetails: any, formatFilesPath: any, namespace: string, models: string, xmlHeaderComment: string) {
  let ViewName = `${namespace}.${models}.${functionDetails.Name}`;
  let ViewTypeName = ViewName;
  let TableColumnItemsList = [];
  let TableColumnItemCount = 0;

  for (const parameterDetails of Object.values(functionDetails.ParametersTable)) {
    // Add all properties otherthan complex typed properties.
    // Complex typed properties are not displayed by the PowerShell Format viewer.
    if (!parameterDetails.Type.toLowerCase().startsWith(namespace.toLowerCase())) {
      TableColumnItemsList.push(`
                            <TableColumnItem>
                                <PropertyName>${parameterDetails.Name}</PropertyName>
                            </TableColumnItem>
`);
      TableColumnItemCount += 1;
    }
  }

  if (!TableColumnItemCount) {
    logVerbose(`It is not required to generated the format file as this definition '${functionDetails.Name}' doesn't have non-complex typed properties.`);
    return;
  }

  let TableColumnHeadersList = [];
  let DefaultWindowSizeWidth = 120;
  // Getting the width value for each property column. Default console window width is 120.
  const TableColumnHeaderWidth = DefaultWindowSizeWidth / TableColumnItemCount | 0;

  if (TableColumnItemCount >= 2) {
    for (let i = 1; i < TableColumnItemCount; ++i) {
      TableColumnHeadersList.push(`
                    <TableColumnHeader>
                        <Width>${TableColumnHeaderWidth}</Width>
                    </TableColumnHeader>
`);
    }
  }
  // Allowing the last property to get the remaining column width, this is useful when customer increases the default window width.
  TableColumnHeadersList.push(`
                    <TableColumnHeader/>
`);

  let TableColumnHeaders = TableColumnHeadersList.join("\r\n");
  let TableColumnItems = TableColumnItemsList.join("\r\n");
  let FormatViewDefinition = `<?xml version="1.0" encoding="utf-8" ?>
${xmlHeaderComment}
<Configuration>
    <ViewDefinitions>
        <View>
            <Name>${ViewName}</Name>
            <ViewSelectedBy>
                <TypeName>${ViewTypeName}</TypeName>
            </ViewSelectedBy>
            <TableControl>
                <TableHeaders>
${TableColumnHeaders}
                </TableHeaders>
                <TableRowEntries>
                    <TableRowEntry>
                        <TableColumnItems>
${TableColumnItems}
                        </TableColumnItems>
                    </TableRowEntry>
                </TableRowEntries>
            </TableControl>
        </View>
    </ViewDefinitions>
</Configuration>
`;

  const commandFilePath = `${formatFilesPath}/${functionDetails.Name}.ps1xml`;
  CreateDirectoryFor(commandFilePath);
  writeFileSync(commandFilePath, FormatViewDefinition);
  logVerbose(`Generated output format file for the definition name '${functionDetails.Name}'.`);
}

const generatedCommandsName = 'Generated.PowerShell.Commands';

function newSwaggerDefinitionCommand(definitionFunctionsDetails: any, swaggerMetaDict: any, namespace: string, models: string, headerContent: string) {
  let PSHeaderComment = null;
  let XmlHeaderComment = null;

  if (headerContent) {
    PSHeaderComment = `<#
${headerContent}
#>`;
    XmlHeaderComment = `<!--
${headerContent}
-->`;
  }

  const FunctionsToExport = [];
  const GeneratedCommandsPath = swaggerMetaDict.OutputDirectory + "/" + generatedCommandsName;
  const SwaggerDefinitionCommandsPath = GeneratedCommandsPath + '/SwaggerDefinitionCommands';
  const FormatFilesPath = GeneratedCommandsPath + '/FormatFiles';

  for (const functionDetails of Object.values(definitionFunctionsDetails)) {
    // Denifitions defined as x_ms_client_flatten are not used as an object anywhere. 
    // Also AutoRest doesn't generate a Model class for the definitions declared as x_ms_client_flatten for other definitions.
    if ((!functionDetails.IsUsedAs_x_ms_client_flatten) && functionDetails.IsModel) {
      if (functionDetails.GenerateDefinitionCmdlet) {
        FunctionsToExport.push(newSwaggerSpecDefinitionCommand(functionDetails, SwaggerDefinitionCommandsPath, `${namespace}.${models}`, PSHeaderComment));
      }

      newSwaggerDefinitionFormatFile(functionDetails, FormatFilesPath, namespace, models, XmlHeaderComment);
    }
  }

  return FunctionsToExport;
}


const advFnSignatureForDefintion = (commandHelp: string, paramHelp: string, commandName: string, paramblock: string, body: string) => `
<#
${commandHelp}
${paramHelp}
#>
function ${commandName}
{
    param(${paramblock}
    )
    ${body}
}
`;

const createObjectStr = (definitionTypeName: string) => `

    $Object = New-Object -TypeName ${definitionTypeName}

    $PSBoundParameters.GetEnumerator() | ForEach-Object { 
        if(Get-Member -InputObject $Object -Name $_.Key -MemberType Property)
        {
            $Object.$($_.Key) = $_.Value
        }
    }

    if(Get-Member -InputObject $Object -Name Validate -MemberType Method)
    {
        $Object.Validate()
    }

    return $Object
`;


