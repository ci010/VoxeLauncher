import { FullModule } from "vuex";
import { RootState } from "../store";

export declare namespace JavaModule {

    interface Java {
        path: string;
        version: string;
        majorVersion: number;
    }
    interface State {
        all: Java[]
        default: number
    }
    interface Getter {
        default: Java
    }
    interface Dispatch {
        (type: 'add', java: Java): Promise<void>
        (type: 'remove', java: Java): Promise<void>
        (type: 'install'): Promise<void>
        (type: 'refresh'): Promise<void>
        (type: 'resolve', java: string): Promise<Java>
    }
}

export type JavaModule = FullModule<JavaModule.State, RootState, Getter, never, Dispatch>;

declare const mod: JavaModule;

export default mod;


