import { Application } from 'spectron';

declare module "mocha" {
    interface Context {
        app: Application;
    }

    interface Suite {
        app: Application;
    }
}