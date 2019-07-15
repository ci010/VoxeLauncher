import { ArtifactVersion, VersionRange } from 'maven-artifact-version';
import { Forge, ForgeWebPage, Version } from 'ts-minecraft';
import packFormatMapping from 'universal/utils/packFormatMapping.json';
import base from 'universal/store/modules/diagnose';
/**
 * 
 * @param {import('universal/store/modules/diagnose').DiagnoseModule.Problem} a 
 * @param {import('universal/store/modules/diagnose').DiagnoseModule.Problem} b 
 * @returns {boolean}
 */
function isSameProblem(a, b) {
    if (a.id !== b.id) return false;
    if (a.arguments && b.arguments) {
        for (const [k, v] of Object.entries(a.arguments)) {
            if (b.arguments[k] !== v) {
                return false;
            }
        }
    }
    return true;
}

/**
 * @param {import('universal/store/modules/diagnose').DiagnoseModule.Problem[]} problems 
 * @param {import('universal/store/modules/diagnose').DiagnoseModule.Problem} newProblem 
 */
function isFixing(problems, newProblem) {
    for (const p of problems) {
        if (isSameProblem(p, newProblem)) {
            return true;
        }
    }
    return false;
}

/**
 * @type {import('universal/store/modules/diagnose').DiagnoseModule}
 */
const mod = {
    ...base,
    actions: {
        async fixProfile(context, problems) {
            const unfixed = problems.filter(p => p.autofix)
                .filter(p => !isFixing(context.state.fixingProblems, p));

            if (unfixed.length === 0) return;

            context.commit('startFixProblems', unfixed);
            context.commit('refreshingProfile', true);

            const profile = context.rootGetters.selectedProfile;
            const { id, mcversion, forge, liteloader } = profile;
            const currentVersion = context.rootGetters.currentVersion;


            if (mcversion === '') {
                context.commit('refreshingProfile', false);
                context.commit('endFixProblems', unfixed);
                return;
            }

            try {
                if (unfixed.some(p => p.id === 'missingVersionJar')) {
                    const versionMeta = context.rootState.version.minecraft.versions.find(v => v.id === mcversion);
                    const handle = await context.dispatch('installMinecraft', versionMeta);
                    await context.dispatch('waitTask', handle);
                }

                if (unfixed.some(p => p.id === 'missingVersionJson')) {
                    const mcvermeta = context.rootState.version.minecraft.versions.find(v => v.id === mcversion);
                    if (!mcvermeta) {
                        throw { error: 'missingVersionMeta', version: mcvermeta };
                    }
                    const mcInstallHandle = await context.dispatch('installMinecraft', mcvermeta);
                    await context.dispatch('waitTask', mcInstallHandle);
                    if (forge.version) {
                        const forgeVersion = context.rootState.version.forge[mcversion];
                        if (!forgeVersion) {
                            throw new Error('unexpected');
                        }
                        const found = forgeVersion.versions.find(v => v.version === forge.version);
                        if (found) {
                            const forge = ForgeWebPage.Version.to(found);
                            const handle = await context.dispatch('installForge', forge);
                            const fullVersion = await context.dispatch('waitTask', handle);
                            const depHandle = await context.dispatch('installDependencies', fullVersion);
                            await context.dispatch('waitTask', depHandle);
                        }
                    }
                    // TODO: support liteloader & fabric
                }

                const missingForgeJar = unfixed.find(p => p.id === 'missingForgeJar');
                if (missingForgeJar && missingForgeJar.arguments) {
                    const { minecraft, forge } = missingForgeJar.arguments;
                    const forgeVersion = context.rootState.version.forge[minecraft];
                    if (!forgeVersion) {
                        throw new Error('unexpected'); // TODO: handle this case
                    }
                    const forgeVer = forgeVersion.versions.find(v => v.version === forge);
                    if (!forgeVer) {
                        console.error('Unexpected missing forge context for missingForgeJar problem');
                    } else {
                        const forgeMeta = ForgeWebPage.Version.to(forgeVer);
                        const handle = await context.dispatch('installForge', forgeMeta);
                        await context.dispatch('waitTask', handle);
                    }
                }

                if (unfixed.some(p => ['missingAssetsIndex', 'missingAssets'].indexOf(p.id) !== -1)) {
                    try {
                        const targetVersion = await context.dispatch('resolveVersion', currentVersion);
                        const handle = await context.dispatch('installAssets', targetVersion);
                        await context.dispatch('waitTask', handle);
                    } catch {
                        console.error('Cannot fix assetes');
                    }
                }
                const missingLibs = unfixed.find(p => p.id === 'missingLibraries');
                if (missingLibs && missingLibs.arguments && missingLibs.arguments.libraries) {
                    const handle = await context.dispatch('installLibraries', { libraries: missingLibs.arguments.libraries });
                    await context.dispatch('waitTask', handle);
                }
                await context.dispatch('diagnoseProfile');
            } catch (e) {
                context.commit('endFixProblems', unfixed);
                console.error(e);
            } finally {
                context.commit('refreshingProfile', false);
            }
        },

        async diagnoseProfile(context) {
            context.commit('refreshingProfile', true);
            const id = context.rootState.profile.id;
            const { mcversion, forge, liteloader } = context.rootState.profile.all[id];
            const currentVersion = context.rootGetters.currentVersion;
            const targetVersion = await context.dispatch('resolveVersion', currentVersion)
                .catch(() => currentVersion.id);

            console.log(`Diagnose for ${targetVersion}`);

            /**
             * @type {import('universal/store/modules/diagnose').DiagnoseModule.Problem[]}
             */
            const problems = [];
            if (!mcversion) {
                problems.push({ id: 'missingVersion' });
            } else {
                const location = context.rootState.root;
                const versionDiagnosis = await Version.diagnose(targetVersion, location);

                if (versionDiagnosis.missingVersionJar) {
                    problems.push({
                        id: 'missingVersionJar',
                        arguments: { version: mcversion },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingAssetsIndex) {
                    problems.push({
                        id: 'missingAssetsIndex',
                        arguments: { version: mcversion },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingVersionJson !== '') {
                    problems.push({
                        id: 'missingVersionJson',
                        arguments: { version: versionDiagnosis.missingVersionJson },
                        autofix: true,
                    });
                }
                if (versionDiagnosis.missingLibraries.length !== 0) {
                    const missingForge = versionDiagnosis.missingLibraries.find(l => l.name.startsWith('net.minecraftforge:forge'));
                    if (missingForge) {
                        const [minecraft, forge] = missingForge.name.substring('net.minecraftforge:forge:'.length).split('-');
                        problems.push({
                            id: 'missingForgeJar',
                            arguments: { minecraft, forge },
                            autofix: true,
                        });
                    }
                    problems.push({
                        id: 'missingLibraries',
                        arguments: {
                            count: versionDiagnosis.missingLibraries.length,
                            libraries: versionDiagnosis.missingLibraries.filter(l => !l.name.startsWith('net.minecraftforge:forge')),
                        },
                        autofix: true,
                    });
                }
                const missingAssets = Object.keys(versionDiagnosis.missingAssets);
                if (missingAssets.length !== 0) {
                    problems.push({
                        id: 'missingAssets',
                        arguments: { count: missingAssets.length },
                        autofix: true,
                    });
                }
            }

            const { resourcepacks, mods } = await context.dispatch('resolveProfileResources', id);
            const resolvedMcVersion = ArtifactVersion.of(mcversion);

            for (const mod of mods) {
                if (mod.type === 'forge') {
                    /**
                     * @type {Forge.MetaData[]}
                     */
                    const metadatas = mod.metadata;
                    for (const meta of metadatas) {
                        const acceptVersion = meta.acceptedMinecraftVersions ? meta.acceptedMinecraftVersions : `[${meta.mcversion}]`;
                        if (!acceptVersion) {
                            problems.push({
                                id: 'unknownMod',
                                arguments: { name: mod.name, actual: mcversion },
                                optional: true,
                            });
                            break;
                        } else {
                            const range = VersionRange.createFromVersionSpec(acceptVersion);
                            if (range && !range.containsVersion(resolvedMcVersion)) {
                                problems.push({
                                    id: 'incompatibleMod',
                                    arguments: { name: mod.name, accepted: acceptVersion, actual: mcversion },
                                    optional: true,
                                });
                                break;
                            }
                        }
                    }
                }
            }

            for (const pack of resourcepacks) {
                if (pack.metadata.format in packFormatMapping) {
                    const acceptVersion = packFormatMapping[pack.metadata.format];
                    const range = VersionRange.createFromVersionSpec(acceptVersion);
                    if (range && !range.containsVersion(resolvedMcVersion)) {
                        problems.push({
                            id: 'incompatibleResourcePack',
                            arguments: { name: pack.name, accepted: acceptVersion, actual: mcversion },
                            optional: true,
                        });
                    }
                }
            }

            let java = context.rootState.profile.all[id].java;

            if (!java || !java.path || !java.majorVersion || !java.version) {
                console.log(`Fix java path ${JSON.stringify(java)}`);
                context.commit('profile', {
                    java: context.rootGetters.defaultJava,
                });
            }

            java = context.rootState.profile.all[id].java;
            if (java && java.majorVersion > 8) {
                if (!resolvedMcVersion.minorVersion || resolvedMcVersion.minorVersion < 13) {
                    problems.push({
                        id: 'incompatibleJava',
                        arguments: { java: java.version, mcversion },
                        optional: true,
                    });
                }
            }

            context.commit('profileProblems', problems);

            context.commit('refreshingProfile', false);
            return problems;
        },
    },
};

export default mod;
