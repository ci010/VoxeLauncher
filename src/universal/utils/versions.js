import { VersionRange, ArtifactVersion } from 'maven-artifact-version';

/**
 * 
 * @param {string} range 
 * @param {string} version 
 */
export function isCompatible(range, version) {
    return VersionRange.createFromVersionSpec(range).containsVersion(ArtifactVersion.of(version));
}

/**
 * 
 * @param {string} minecraft 
 * @param {string | undefined} forge 
 * @param {string | undefined} liteloader 
 */
export function getExpectVersion(minecraft, forge, liteloader) {
    let expectedId = minecraft;
    if (typeof forge === 'string' && forge.length > 0) expectedId += `-forge${minecraft}-${forge}`;
    if (typeof liteloader === 'string' && liteloader.length > 0) expectedId += `-liteloader${liteloader}`;
    return expectedId;
}
