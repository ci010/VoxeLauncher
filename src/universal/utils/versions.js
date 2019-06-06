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
 * @param {string} forge 
 * @param {string} liteloader 
 */
export function getExpectVersion(minecraft, forge, liteloader) {
    let expectedId = minecraft;
    if (forge) expectedId += `-forge${minecraft}-${forge}`;
    if (liteloader) expectedId += `-liteloader${liteloader}`;
    return expectedId;
}
