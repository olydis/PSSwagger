
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







// PATH

function getSwaggerSpecPathInfo(
  JsonPathItemObject: any,
  PathFunctionDetails: any,
  swaggerDict: any,
  SwaggerMetaDict: any,
  DefinitionFunctionsDetails: any,
  ParameterGroupCache: any,
  PSMetaJsonObject: any
) {

  const UseAzureCsharpGenerator = SwaggerMetaDict['UseAzureCsharpGenerator'];
  const EndpointRelativePath = JsonPathItemObject.Name;

  let PSMetaPathJsonObject = null;
  if (PSMetaJsonObject) {
    if (PSMetaJsonObject.paths && PSMetaJsonObject.paths[EndpointRelativePath]) {
      PSMetaPathJsonObject = PSMetaJsonObject.paths[EndpointRelativePath]
    }
    else if (PSMetaJsonObject['x-ms-paths'] && PSMetaJsonObject['x-ms-paths'][EndpointRelativePath]) {
      PSMetaPathJsonObject = PSMetaJsonObject['x-ms-paths'][EndpointRelativePath];
    }
  }

  // First get path level common parameters, if any, which will be common to all operations in this swagger path.
  let PathCommonParameters = {};
  if (JsonPathItemObject.Value.parameters) {
    let PSMetaParametersJsonObject = PSMetaPathJsonObject && PSMetaPathJsonObject.parameters || null;
    PathCommonParameters = getPathParamInfo(JsonPathItemObject.Value, swaggerDict, DefinitionFunctionsDetails, ParameterGroupCache, PathCommonParameters, PSMetaParametersJsonObject);
  }

  let ResourceIdAndInputObjectDetails = null;
  if (UseAzureCsharpGenerator) {
    ResourceIdAndInputObjectDetails = getAzureResourceIdParameters(JsonPathItemObject.Value, EndpointRelativePath, swaggerDict['Info'].NameSpace, swaggerDict['Info'].Models, swaggerDict['Definitions']);
  }

  for (const operationType in JsonPathItemObject.Value) {
    let longRunningOperation = false;
    const value = JsonPathItemObject.Value[operationType];
    if (value['x-ms-long-running-operation']) {
      longRunningOperation = true;
    }

    let x_ms_pageableObject = null;
    if (value['x-ms-pageable']) {
      x_ms_pageableObject = {};
      if (value['x-ms-pageable'].operationName) {
        x_ms_pageableObject['operationName'] = value['x-ms-pageable'].operationName;
      }

      if (value['x-ms-pageable'].itemName) {
        x_ms_pageableObject['operationName'] = value['x-ms-pageable'].itemName;
      }

      x_ms_pageableObject['operationName'] = value['x-ms-pageable'].nextLinkName || null;
    }

    let operationSecurityObject = value.security || swaggerDict.Security || null;

    const cmdletInfoOverrides = [];
    let PSMetaOperationJsonObject = PSMetaPathJsonObject && PSMetaPathJsonObject[operationType] || null;

    if (value.operationId) {
      const operationId = value.operationId
      const defaultCommandNames = getPathCommandName(operationId);
      if (PSMetaOperationJsonObject && PSMetaOperationJsonObject['x-ps-cmdlet-infos']) {
        for (const fred of PSMetaOperationJsonObject && PSMetaOperationJsonObject['x-ps-cmdlet-infos']) {
          const metadataName = fred.name || null;

          const cmdletInfoOverride = {
            Name: metadataName,
            Metadata: fred
          };

          // If no name override is specified, apply all these overrides to each default command name
          if (!metadataName) {
            for (const defaultCommandName of defaultCommandNames) {
              cmdletInfoOverrides.push({
                Name: defaultCommandName.name,
                Metadata: cmdletInfoOverride.Metadata
              });
            }
          }
          else {
            cmdletInfoOverrides.push(cmdletInfoOverride);
          }
        }
      }
      else if (value['x-ps-cmdlet-infos']) {
        for (const cmdletMetadata of value['x-ps-cmdlet-infos']) {
          const cmdletInfoOverride = { Metadata: cmdletMetadata };
          if (cmdletMetadata.name) {
            cmdletInfoOverride['name'] = cmdletMetadata.name;
          }

          // If no name override is specified, apply all these overrides to each default command name
          if (!cmdletMetadata.name) {
            for (const defaultCommandName of defaultCommandNames) {
              cmdletInfoOverrides.push({
                Name: defaultCommandName.name,
                Metadata: cmdletInfoOverride.Metadata
              });
            }
          }
          else {
            cmdletInfoOverrides.push(cmdletInfoOverride);
          }
        }
      }

      const FunctionDescription = value.description || "";
      const FunctionSynopsis = value.summary || "";

      let ParametersTable: any = {};
      // Add Path common parameters to the operation's parameters list.
      for (const key in PathCommonParameters) {
        // Cloning the common parameters object so that some values can be updated.
        const PathCommonParamDetails = JSON.parse(JSON.stringify(PathCommonParameters[key]));
        if (PathCommonParamDetails.OriginalParameterName) {
          PathCommonParamDetails['OriginalParameterName'] = '';
        }
        ParametersTable[key] = PathCommonParamDetails;
      }

      const PSMetaParametersJsonObject = PSMetaOperationJsonObject && PSMetaOperationJsonObject.parameters || null;

      ParametersTable = getPathParamInfo(value, swaggerDict, DefinitionFunctionsDetails, ParameterGroupCache, ParametersTable, PSMetaOperationJsonObject);

      const responses = value.responses || "";
      const commandNames = cmdletInfoOverrides.length > 0 ? cmdletInfoOverrides : getPathCommandName(operationId);

      // Priority of a parameterset will be used to determine the default parameterset of a cmdlet.
      let Priority = 0
      let ParametersCount = Object.keys(ParametersTable).length;
      if (ParametersCount) {
        // Priority for parameter sets with mandatory parameters starts at 100
        let Priority = 100

        // Get Name parameter details, if exists.
        // If Name parameter is already available, ResourceName parameter name will not be changed.
        const NameParameterDetails = Object.values(ParametersTable).filter(x => x.Name === "Name");

        for (const value of Object.values(ParametersTable)) {
          if (value.Mandatory === '$true') {
            Priority++;
          }

          // Add alias for the resource name parameter.
          if (ResourceIdAndInputObjectDetails &&
            !NameParameterDetails &&
            (value.Name !== 'Name') &&
            (value.Name === ResourceIdAndInputObjectDetails.ResourceName)) {
            value['Alias'] = 'Name';
          }
        }

        // If there are no mandatory parameters, use the parameter count as the priority.                
        if (Priority === 100) {
          Priority = ParametersCount;
        }
      }

      const ParameterSetDetail = {
        Description: FunctionDescription,
        Synopsis: FunctionSynopsis,
        ParameterDetails: ParametersTable,
        Responses: responses,
        ParameterSetName: operationId,
        OperationId: operationId,
        OperationType: operationType,
        EndpointRelativePath: EndpointRelativePath,
        PathCommonParameters: PathCommonParameters,
        Priority: Priority,
        'x-ms-pageable': x_ms_pageableObject
      };

      if (value['x-ms-odata']) {
        // Currently only the existence of this property is really important, but might as well save the value
        ParameterSetDetail['x-ms-odata'] = value['x-ms-odata'];
      }

      // There's probably a better way to do this...
      const opIdValues = operationId.split("_", 2);
      let approximateVerb;
      if (opIdValues.length !== 2) {
        approximateVerb = operationId;
      }
      else {
        approximateVerb = opIdValues[1];
        if (!UseAzureCsharpGenerator &&
          swaggerDict.Definitions[opIdValues[0]]) {
          ParameterSetDetail['UseOperationsSuffix'] = true;
        }
      }

      let InputObjectParameterSetDetail = null;
      let ResourceIdParameterSetDetail = null;
      if (ResourceIdAndInputObjectDetails) {
        // InputObject parameterset
        const InputObjectParameterDetails = {
          Name: 'InputObject',
          Type: ResourceIdAndInputObjectDetails.InputObjectParameterType,
          ValidateSet: '',
          Mandatory: '$true',
          Description: "The input object of type $($ResourceIdAndInputObjectDetails.InputObjectParameterType).",
          IsParameter: true,
          OriginalParameterName: 'InputObject',
          FlattenOnPSCmdlet: false,
          ValueFromPipeline: true
        };
        const InputObjectParamSetParameterDetails = { "0": InputObjectParameterDetails };
        let index = 1;
        let ClonedParameterSetDetail = JSON.parse(JSON.stringify(ParameterSetDetail));
        for (const paramDetails of Object.values(ClonedParameterSetDetail.ParameterDetails)) {
          if (!ResourceIdAndInputObjectDetails.ResourceIdParameters.includes(paramDetails.Name)) {
            InputObjectParamSetParameterDetails[index++] = paramDetails;
          }
        }
        ClonedParameterSetDetail.ParameterDetails = InputObjectParamSetParameterDetails;
        ClonedParameterSetDetail.Priority += 1;
        ClonedParameterSetDetail.ParameterSetName = "InputObject_" + ClonedParameterSetDetail.ParameterSetName;
        InputObjectParameterSetDetail = ClonedParameterSetDetail;

        // ResourceId parameterset
        const ResourceIdParameterDetails = {
          Name: 'ResourceId',
          Type: 'System.String',
          ValidateSet: '',
          Mandatory: '$true',
          Description: 'The resource id.',
          IsParameter: true,
          OriginalParameterName: 'ResourceId',
          FlattenOnPSCmdlet: false,
          ValueFromPipelineByPropertyName: true
        };
        const ResourceIdParamSetParameterDetails = { "0": ResourceIdParameterDetails };
        index = 1;
        ClonedParameterSetDetail = JSON.parse(JSON.stringify(ParameterSetDetail));
        for (const paramDetails of Object.values(ClonedParameterSetDetail.ParameterDetails)) {
          if (!ResourceIdAndInputObjectDetails.ResourceIdParameters.includes(paramDetails.Name)) {
            ResourceIdAndInputObjectDetails[index++] = paramDetails;
          }
        }
        ClonedParameterSetDetail.ParameterDetails = ResourceIdParamSetParameterDetails;
        ClonedParameterSetDetail.Priority += 2;
        ClonedParameterSetDetail.ParameterSetName = "ResourceId_" + ClonedParameterSetDetail.ParameterSetName;
        InputObjectParameterSetDetail = ClonedParameterSetDetail;

        ParameterSetDetail['ClonedParameterSetNames'] = [
          "InputObject_" + ParameterSetDetail.ParameterSetName,
          "ResourceId_" + ParameterSetDetail.ParameterSetName
        ];
        ParameterSetDetail['ResourceIdParameters'] = ResourceIdAndInputObjectDetails.ResourceIdParameters;
      }

      for (const commandName of commandNames) {
        let FunctionDetails: any = {};
        if (PathFunctionDetails[commandName.name]) {
          FunctionDetails = PathFunctionDetails[commandName.name];
        }
        else {
          FunctionDetails['CommandName'] = commandName.name;
          FunctionDetails['x-ms-long-running-operation'] = longRunningOperation;
        }

        if (commandName.Metadata && !FunctionDetails.Metadata) {
          FunctionDetails.Metadata = commandName.Metadata;
        }

        if (operationSecurityObject) {
          FunctionDetails['Security'] = operationSecurityObject;
        }

        let ParameterSetDetails = [];
        if (FunctionDetails.ParameterSetDetails) {
          ParameterSetDetails = FunctionDetails['ParameterSetDetails'];
        }

        ParameterSetDetails.push(ParameterSetDetail);
        if (InputObjectParameterSetDetail) {
          ParameterSetDetails.push(InputObjectParameterSetDetail);
        }
        if (ResourceIdParameterSetDetail) {
          ParameterSetDetails.push(ResourceIdParameterSetDetail);
        }

        FunctionDetails['ParameterSetDetails'] = ParameterSetDetails;
        PathFunctionDetails[commandName.name] = FunctionDetails;
      }
    }
  }
  return PathFunctionDetails;
}

function getDefinitionParameters(JsonDefinitionItemObject: any, DefinitionFunctionsDetails: any, definitionName: string, namespace: string, models: string, parametersTable: any) {
  for (const name of Object.keys(JsonDefinitionItemObject.Value && JsonDefinitionItemObject.Value.properties || {})) {
    const ParameterJsonObject = JsonDefinitionItemObject.Value.properties[name];
    const parameterName = getPascalCasedString(ParameterJsonObject['x-ms-client-name'] || name);

    if ((parameterName === 'Properties') &&
      ParameterJsonObject['x-ms-client-flatten'] &&
      ParameterJsonObject.properties) {
      // Flatten the properties with x-ms-client-flatten
      getDefinitionParameters(ParameterJsonObject, DefinitionFunctionsDetails, definitionName, namespace, models, parametersTable);
    }
    else {
      const ParameterDetails = {};
      let IsParamMandatory = '$false';
      let ValidateSetString = null;
      let ParameterDescription = '';

      const TypeResult = getDefinitionParameterType(ParameterJsonObject, definitionName, parameterName, DefinitionFunctionsDetails, `${namespace}.Models`, parametersTable);
      const ParameterType = TypeResult.ParameterType;
      if (TypeResult.ValidateSet) {
        ValidateSetString = `'${TypeResult.ValidateSet.join("', '")}'`;
      }
      if (JsonDefinitionItemObject.Value.Required && JsonDefinitionItemObject.Value.Required.includes(parameterName)) {
        IsParamMandatory = '$true';
      }

      if (ParameterJsonObject.Enum) {
        if (!ParameterJsonObject['x-ms-enum'] || ParameterJsonObject['x-ms-enum'].modelAsString) {
          const ValidateSet = ParameterJsonObject.Enum.map(x => x.replace(/'/g, "''"));
          ValidateSetString = `'${ValidateSet.join(', ')}'`;
        }
      }

      if (ParameterJsonObject.Description) {
        ParameterDescription = ParameterJsonObject.Description;
      }

      ParameterDetails['Name'] = parameterName;
      ParameterDetails['Type'] = ParameterType;
      ParameterDetails['ValidateSet'] = ValidateSetString;
      ParameterDetails['Mandatory'] = IsParamMandatory;
      ParameterDetails['Description'] = ParameterDescription;
      ParameterDetails['OriginalParameterName'] = name;

      if (ParameterType) {
        parametersTable[parameterName] = ParameterDetails;
      }
    }
  } // Properties
  return parametersTable;
}