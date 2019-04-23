
describe('curseforge', function () {
    it('should fetch projects', async function () {
        const projects = await this.store.dispatch('curseforge/projects', { project: 'mc-mods' });
    }).timeout(1000000);
});

describe('profile', function () {
    it('should be able to create a profile', async function () {
        const id = await this.store.dispatch('profile/create');
    });
});
