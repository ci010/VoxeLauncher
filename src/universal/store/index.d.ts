import { Module, Context, RootState, RootGetter } from "./store";
import { StoreOptions } from 'vuex';
type C = Context<{ root: string }, { path: (...args: string[]) => string }, {}, Actions>
interface Actions {
    showItemInFolder(context: C, item: string): Promise<void>;
    openItem(context: C, item: string): Promise<void>;
}

export interface RootModule extends Module<{ root: string }, { path: (...args: string[]) => string }, {}, Actions> {
    modules: any
    strict: boolean
}
declare var template: StoreOptions<RootState>;
export = template