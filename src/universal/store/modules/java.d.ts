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
        defaultJava: Java
        missingJava: boolean
    }
    interface Mutations {
        addJava(type: State, java: Java): void
        removeJava(type: State, java: Java): void
        defaultJava(type: State, java: Java): void
    }
    type C = Context<State, Getters, Mutations, Actions>
    interface Actions {
        installJava(context: C): Promise<string | undefined>
        refreshLocalJava(context: C): Promise<void>
        redirectToJvmPage(context: C): Promise<void>
        resolveJava(context: C, java: string): Promise<Java | undefined>
    }
}

export type JavaModule = Module<JavaModule.State, JavaModule.Getters, JavaModule.Mutations, JavaModule.Actions>;

declare const mod: JavaModule;

export default mod;


