export interface CurseForgeModPack {
    manifestType: string | 'minecraftModpack',
    manifestVersion: number,
    name: string,
    version: string,
    author: string,
    overrides: string, // override folder
    minecraft: {
        version: string,
        modLoaders: {
            id: string,
            primary: boolean
        }[]
    },
    files: {
        projectID: number,
        fileID: number,
        required: boolean,
    }[]
}