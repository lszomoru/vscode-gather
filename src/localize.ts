import * as path from 'path';
import * as fs from 'fs-extra';
import { Constants } from './types/types';

export namespace Common {
    export const gatherError = localize('Gather.error', 'Gather internal error');
    export const gatherTooltip = localize('Gather.tooltip', 'Gather the code required to generate this cell into a new notebook');
    export const runCells = localize('Gather.runCells', 'Please run cells before gathering');
    export const gatheredScriptDescription = localize(
        'Gather.scriptDescription',
        '# This file was generated by the Gather Extension.\n# It requires version 2020.11.0 (or newer) of the Jupyter Extension.\n#\n#     The intent is that it contains only the code required to produce\n#     the same results as the cell originally selected for gathering.\n#     Please note that the Python analysis is quite conservative, so if\n#     it is unsure whether a line of code is necessary for execution, it\n#     will err on the side of including it.\n#\n# Please let us know if you are satisfied with what was gathered here:\n# https://aka.ms/gatherfeedback\n\n'
    );
    export const gatheredNotebookDescriptionInMarkdown = localize(
        'Gather.notebookDescriptionInMarkdown',
        '## Gathered Notebook\n\nThis notebook was generated by the Gather Extension. It requires version 2020.11.0 (or newer) of the Jupyter Extension, please update [here](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter). The intent is that it contains only the code and cells required to produce the same results as the cell originally selected for gathering. Please note that the Python analysis is quite conservative, so if it is unsure whether a line of code is necessary for execution, it will err on the side of including it.\n\n**Please let us know if you are satisfied with what was gathered [here](https://aka.ms/gatherfeedback).**\n\n'
    );
    export const gatheredScriptDescriptionWithoutSurvey = localize(
        'Gather.scriptDescriptionWithoutSurvey',
        '# This file was generated by the Gather Extension.\n# It requires version 2020.11.0 (or newer) of the Jupyter Extension.\n#\n#     The intent is that it contains only the code required to produce\n#     the same results as the cell originally selected for gathering.\n#     Please note that the Python analysis is quite conservative, so if\n#     it is unsure whether a line of code is necessary for execution, it\n#     will err on the side of including it.\n'
    );
    export const gatheredNotebookDescriptionInMarkdownWithoutSurvey = localize(
        'Gather.notebookDescriptionInMarkdownWithoutSurvey',
        '## Gathered Notebook\n\nThis notebook was generated by the Gather Extension. It requires version 2020.11.0 (or newer) of the Jupyter Extension, please update [here](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter). The intent is that it contains only the code and cells required to produce the same results as the cell originally selected for gathering. Please note that the Python analysis is quite conservative, so if it is unsure whether a line of code is necessary for execution, it will err on the side of including it.\n\n'
    );
}

// Skip using vscode-nls and instead just compute our strings based on key values. Key values
// can be loaded out of the nls.<locale>.json files
let loadedCollection: Record<string, string> | undefined;
let defaultCollection: Record<string, string> | undefined;
let askedForCollection: Record<string, string> = {};
let loadedLocale: string;

export function localize(key: string, defValue?: string) {
    // Return a pointer to function so that we refetch it on each call.
    return () => {
        return getString(key, defValue);
    };
}

function getString(key: string, defValue?: string) {
    // Load the current collection
    if (!loadedCollection || parseLocale() !== loadedLocale) {
        load();
    }

    // The default collection (package.nls.json) is the fallback.
    // Note that we are guaranteed the following (during shipping)
    //  1. defaultCollection was initialized by the load() call above
    //  2. defaultCollection has the key (see the "keys exist" test)
    let collection = defaultCollection!;

    // Use the current locale if the key is defined there.
    if (loadedCollection && loadedCollection.hasOwnProperty(key)) {
        collection = loadedCollection;
    }
    let result = collection[key];
    if (!result && defValue) {
        // This can happen during development if you haven't fixed up the nls file yet or
        // if for some reason somebody broke the functional test.
        result = defValue;
    }
    askedForCollection[key] = result;

    return result;
}

function parseLocale(): string {
    // Attempt to load from the vscode locale. If not there, use english
    const vscodeConfigString = process.env.VSCODE_NLS_CONFIG;
    return vscodeConfigString ? JSON.parse(vscodeConfigString).locale : 'en-us';
}

function load() {
    // Figure out our current locale.
    loadedLocale = parseLocale();

    // Find the nls file that matches (if there is one)
    const nlsFile = path.join(Constants.EXTENSION_ROOT_DIR, `package.nls.${loadedLocale}.json`);
    if (fs.existsSync(nlsFile)) {
        const contents = fs.readFileSync(nlsFile, 'utf8');
        loadedCollection = JSON.parse(contents);
    } else {
        // If there isn't one, at least remember that we looked so we don't try to load a second time
        loadedCollection = {};
    }

    // Get the default collection if necessary. Strings may be in the default or the locale json
    if (!defaultCollection) {
        const defaultNlsFile = path.join(Constants.EXTENSION_ROOT_DIR, 'package.nls.json');
        if (fs.existsSync(defaultNlsFile)) {
            const contents = fs.readFileSync(defaultNlsFile, 'utf8');
            defaultCollection = JSON.parse(contents);
        } else {
            defaultCollection = {};
        }
    }
}
