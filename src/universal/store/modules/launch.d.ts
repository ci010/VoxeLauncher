import { Module, Context } from "../store";

export type C = Context<State, {}, Mutations, Actions>;
export interface Actions {
    launch(context: C, profileId?: string): Promise<boolean>;
}

type Status = 'ready' | 'checkingProblems' | 'launching' | 'launched' | 'minecraftReady';
export interface State {
    status: Status
}

export interface Mutations {
    launchStatus(state: State, status: Status): void
}

export type LauncherModule = Module<"launch", State, {}, Mutations, Actions>;

declare const mod: LauncherModule;

export default mod;
