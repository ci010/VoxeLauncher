import { FullModule } from "vuex";
import { RootState } from "../store";
import { Task, TaskNode } from 'treelike-task';

export namespace TaskModule {
    interface State {
        tree: { [uuid: string]: TaskNode },
        tasks: TaskNode[],
        maxLog: number,
    }
}

export type TaskModule = FullModule<TaskModule.State, RootState, {}, {}, {}>;
