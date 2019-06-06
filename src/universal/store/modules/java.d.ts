import { Module, Context } from "../store";

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
    interface Getters {
        default: Java
        missing: boolean
    }
    interface Mutations {
        add(type: State, java: Java): void
        remove(type: State, java: Java): void
        default(type: State, java: Java): void
    }
    type C = Context<State, Getters, Mutations, Actions>
    interface Actions {
        load(context: C): Promise<void>
        add(context: C, java: Java): Promise<void>
        remove(context: C, java: Java): Promise<void>
        install(context: C): Promise<string | undefined>
        refresh(context: C): Promise<void>
        redirect(context: C): Promise<void>
        resolve(context: C, java: string): Promise<Java | undefined>
    }
}

export type JavaModule = Module<JavaModule.State, JavaModule.Getters, JavaModule.Mutations, JavaModule.Actions>;

declare const mod: JavaModule;

export default mod;


