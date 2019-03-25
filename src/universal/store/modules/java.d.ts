import { FullModule } from "vuex";
import { RootState } from "../store";

export declare namespace JavaModule {

    interface State {
        all: string[]
        default: string
    }

    interface Dispatch {
        (type: 'add', java: string): Promise<void>
        (type: 'remove', java: string): Promise<void>
        (type: 'install'): Promise<void>
        (type: 'refresh'): Promise<void>
        (type: 'test', java: string): Promise<void>
    }
}

export type JavaModule = FullModule<JavaModule.State, RootState, never, never, Dispatch>;

declare const mod: JavaModule;

export default mod;


