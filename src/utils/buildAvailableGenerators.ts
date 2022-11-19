import getGeneratorClass from "./getGeneratorClass";

export function buildAvailableGenerators(types: {[key: string]: string[]}, defaults: {[key: string]: string}) {
    const defaultType = Object.keys(types)[0];
    const defaultLanguage = defaults[defaultType];
    return {
        default: getGeneratorClass(defaultType, defaultLanguage),
        ...types[defaultType].reduce((acc, l) => {
            acc[`default__${l}`] = getGeneratorClass(defaultType, l);
            return acc;
        }, {} as any),
        ...Object.entries(types).reduce((acc, [t, languages]: [string, string[]]) => {
            acc[t] = getGeneratorClass(t, defaults[t]);
            return languages.reduce((acc2, l) => {
                acc2[`${t}__${l}`] = getGeneratorClass(t, l);
                return acc2;
            }, acc);
        }, {} as any),
    };
}

// noinspection JSUnusedGlobalSymbols
export default buildAvailableGenerators;