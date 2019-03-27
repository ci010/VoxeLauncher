describe('curseforge', function () {
    it('should fetch projects', async function () {
        const projects = await this.store.dispatch('curseforge/projects', { project: 'mc-mods' });
        console.log(projects)
    });
});
