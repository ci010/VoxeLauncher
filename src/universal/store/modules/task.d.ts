import { FullModule } from "vuex";
import { RootState } from "../store";
import { Task } from 'treelike-task';

export namespace TaskModule {
    interface State {
        tree: { [uuid: string]: string }
        running: string[],
        history: string[],
    }
}

export type TaskModule = FullModule<TaskModule.State, RootState, {}, {}, {}>;
