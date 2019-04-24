
describe('any', function () {
    it('should work', function () {
        return this.app.client.getTitle()
            .then((title) => {
                expect(title).to.equal('my-project');
            });
    });
});
// describe('curseforge', function () {
//     it('should fetch projects', async function () {
//         const projects = await this.store.dispatch('curseforge/projects', { project: 'mc-mods' });
//     }).timeout(1000000);
// });

// describe('profile', function () {
//     it('should be able to create a profile', async function () {
//         const id = await this.store.dispatch('profile/create');
//     });
// });
