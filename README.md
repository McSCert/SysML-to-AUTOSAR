# SysML 2 AUTOSAR Transformation

Rhapsody M2M transformation is from SysML to AUTOSAR (Classic). In order to open, view, and run the M2M transformation, you need Rhapsody 9.0.1 and [Sodius M2M plugins](https://www.sodiuswillert.com/en/products/model-to-model-transformation-for-rhapsody). 

The demo project and M2M Ruleset table are in the rhapsody folder. Altough the Rhapsody project contains the JavaScript (JS) files, we have provided them in a separate javascript folder.

- To export a SysML model into AUTOSAR using Rhapsody modeling environment: expand M2MExportRulesets-->Right click on sysML2ARXML --> select M2M-Export Model --> select the target path and OK.

## SysML to AUTOSAR JS

The purpose of the accompaning sysML2ArFunctions JavaScript (JS) file is to provide a set of JS functions that can be called from a Rhapsody M2M Ruleset to allow development of the pre-condition, new context and post-processing functions outisde of Rhapsody. In turn, this allows the use of JS aware IDEs that can provide a better development environment than Rhapsody. 

### The sysml2ar.js Script

This script contains a set of functions that are used as pre-condition, new context and post-processing, and additional helper functions.

Functions use a prefix in order to identify them as condition, context or
post-process functions.

    JSConditionExport   -> ce
    JSNewContextExport  -> nce
    JSPostprocessExport -> ppe

Since functions in a library cannot be directly assigned to condition, context or postprocess cells, we suggest that instead of copying code in this file to 
the Rhapsody JS editor, you write short delegate functions. For example:

- JSConditionExport:
  
        return ceXXX(element);

- JSNewContextExport:

        return nceXXX(element);

- JSPostprocessExport:
   
        ppeXXX(element);
        
It allows you to edit the script file using a JS friendly editor (to get syntax check, variable resolution, formating, etc.).

### The TypeScript (TS) helpers

The `package.json`, `jsconfig.json` and typing files (in the typings folder) provide partial typing information of the Rhapsody and AUTOSAR APIs. This typing information can be used. For example, in VSCodium, to improve content assist and some basic type checking.
