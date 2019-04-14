import { FullModule } from "vuex";
import { RootState } from "../store";
import { Task, TaskNode } from 'treelike-task';

export namespace TaskModule {
    interface State {
        tree: { [uuid: string]: TaskNode }
        running: string[],
        history: string[],
    }
}

export type TaskModule = FullModule<TaskModule.State, RootState, {}, {}, {}>;
