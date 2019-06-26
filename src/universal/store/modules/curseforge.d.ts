import { Module, Context, TaskHandle } from "../store";

export namespace CurseForgeModule {

    interface Download {
        type: string;
        name: string;
        href: string;
        size: string;
        date: string;
        version: string;
        downloadCount: string;
    }
    interface Downloads {
        pages: number,
        versions: Version[],
        files: Download[],
    }

    interface ProjectPreview {
        path: string;
        name: string;
        author: string;
        description: string;
        date: string;
        count: string;
        categories: {
            href: string;
            icon: string;
        }[];
        icon: string;
    }

    interface Project {
        image: string,
        name: string,
        createdDate: string,
        lastFile: string,
        totalDownload: string,
        license: string,
        description: string,
    }

    interface Version {
        type: string;
        text: string;
        value: string;
    }
    interface Filter {
        text: string;
        value: string;
    }


    type C = Context<{}, {}, {}, Actions>

    interface Modpack {
        manifestType: string;
        manifestVersion: number;
        minecraft: {
            version: string;
            libraries?: string;
            modLoaders: {
                id: string;
                primary: boolean;
            }[];
        };
        name: string;
        version: string;
        author: string;
        files: {
            projectId: number;
            fileId: number;
            required: boolean;
        }[];
        override: string;
    }
    interface Actions {
        importCurseforgeModpack(context: C, path: string): Promise<TaskHandle>;
        fetchCurseForgeProjects(context: C, option?: { page?: string, version?: string, filter?: string, project?: string }): Promise<{
            projects: ProjectPreview[], pages: number, versions: Version[], filters: Filter[]
        }>

        /**
         * Query the project detail from path.
         */
        fetchCurseForgeProject(context: C, path: string): Promise<Project>;

        /**
         * Query the project downloadable files.
         */
        fetchCurseForgeProjectFiles(context: C, payload?: { path?: string, version?: string, page?: number }): Promise<Downloads>

        fetchCurseForgeProjectLicense(context: C, licenseUrl: string): Promise<string>;

        downloadAndImportFile(context: C, payload: { project: Project, file: Download }): Promise<TaskHandle>
    }
}
export interface CurseForgeModule extends Module<"curseforge", {}, {}, {}, CurseForgeModule.Actions> {
}