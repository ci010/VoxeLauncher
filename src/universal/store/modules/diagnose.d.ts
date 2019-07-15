import { Module, Context } from "../store";

declare namespace DiagnoseModule {
    interface Problem {
        id: string;
        arguments?: { [key: string]: any };
        autofix?: boolean;
        optional?: boolean;
    }

    interface State {
        fixingProblems: Problem[];
    }

    interface Mutations {
        startFixProblems(state: State, fixingProblems: Problem[]): void;
        endFixProblems(state: State, problems: Problem[]): void;
    }
    type C = Context<State, {}, Mutations, Actions>;
    interface Actions {
        diagnoseProfile(context: C): Promise<Problem[]>;
        fixProfile(context: C, problems: Problem[]): Promise<void>
    }
}
export interface DiagnoseModule extends Module<"diagnose", DiagnoseModule.State, {}, DiagnoseModule.Mutations, DiagnoseModule.Actions> { }

declare const mod: DiagnoseModule;

export default mod;
