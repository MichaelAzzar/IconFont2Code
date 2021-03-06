import { toUnicodeString } from './utils/stringUtils.js';

export function generateCsharpCode(glyphs, prefixToRemove, csharpClassName, importedCSharpFieldMappings) {
    // Generate the field info array with {name, value}
    const ctx = {};
    let cSharpFields = glyphs.map((glyph) => getCSharpFieldInfo(glyph, prefixToRemove, importedCSharpFieldMappings, ctx));

    // Generate the C# code for the class with field info
    return generateCSharpCodeForClass(csharpClassName, cSharpFields);
}

function getCSharpFieldInfo(glyph, prefixToRemove, importedCSharpFieldMappings, ctx) {
    return {
        name: getCSharpFieldName(glyph, prefixToRemove, importedCSharpFieldMappings, ctx),
        value: toUnicodeString(glyph.unicode)
    };

    function getCSharpFieldName(glyph, prefixToRemove, importedCSharpFieldMappings, ctx) {
        if (importedCSharpFieldMappings && importedCSharpFieldMappings[glyph.unicode] !== undefined)
            return importedCSharpFieldMappings[glyph.unicode];
        else
            return getFieldName(glyph.name, prefixToRemove, ctx);

        function getFieldName(name, prefixToRemove, ctx) {
            if (typeof name !== 'string' || name.length == 0) {
                return autoGenerateFieldName(name, ctx);
            }

            name = name.replace(/ /g, "");
            name = removePrefix(name, prefixToRemove);
            name = toCamelCase(name);
            name = makeCSharpLegalFieldName(name);

            // Always make sure there's a name
            if (typeof name !== 'string' || name.length == 0)
                return autoGenerateFieldName(name, ctx);
            else
                return name;

            function removePrefix(name, prefixToRemove) {
                if (!prefixToRemove || !name)
                    return name;

                let prefixes = prefixToRemove.split(",");
                let i = 0;
                while (i < prefixes.length) {
                    if (name.toLowerCase().startsWith(prefixes[i].toLowerCase())) {
                        name = name.substr(prefixes[i].length);
                        i = 0;
                        continue;
                    }
                    ++i;
                }
                return name;
            }

            function toCamelCase(name) {
                // Leave single letter names unprocessed
                if (name.length == 1)
                    return name;

                let s = "";
                let toUpper = true;
                for (let i = 0; i < name.length; ++i) {
                    let c = name[i];
                    if (c == '-') {
                        toUpper = true;
                    }
                    else {
                        s += toUpper ? c.toUpperCase() : c;
                        toUpper = false;
                    }
                }
                return s;
            }

            function autoGenerateFieldName(name, ctx) {
                if (!ctx.autoGenFieldNamesCount)
                    ctx.autoGenFieldNamesCount = 0;
                name = `Icon${++ctx.autoGenFieldNamesCount}`;
                return name;
            }

            function makeCSharpLegalFieldName(name) {
                name = removeIllegalChars(name);
                name = makeNameUnique(name, ctx);
                return name;

                // https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure#identifiers
                function removeIllegalChars(name) {
                    name = name.replace(/\./g, "");
                    return name;
                }

                function makeNameUnique(suggestedName, ctx) {
                    if (!suggestedName)
                        return;

                    // Check and save the generated field names to enfore uniquness
                    if (!ctx.generatedFieldNames) ctx.generatedFieldNames = [];

                    if (ctx.generatedFieldNames.includes(suggestedName)) {
                        let index = 0;
                        let newName = "";
                        do {
                            newName = `${suggestedName}_${++index}`;
                        } while (ctx.generatedFieldNames.includes(newName));

                        suggestedName = newName;
                    }

                    ctx.generatedFieldNames.push(suggestedName);
                    return suggestedName;
                }
            }
        }
    }
}

function generateCSharpCodeForClass(csharpClassName, fields) {
    if (!csharpClassName)
        csharpClassName = "IconFont";

    let s = `static class ${csharpClassName}`;
    s += "\n{";
    fields.sort(f => f.name).forEach(f => s += generateCSharpCodeForField(f));
    s += "\n}";

    return s;

    function generateCSharpCodeForField(field) {
        return `\n\tpublic const string ${field.name} = "${field.value}";`;
    }
}

/*
function generateXAMLCode(fontName, fontFileName) {
    const s = `<OnPlatform x:Key="IconsFontFamily"\n            x:TypedArguments="x:String"\n            Android=\"${fontFileName}#${fontName}\"\n            iOS="${fontName}" />`;
    return htmlEncode(s);
}*/