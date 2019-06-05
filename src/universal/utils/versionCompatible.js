import { VersionRange, ArtifactVersion } from 'maven-artifact-version';

export default function compatible(range, version) {
    return VersionRange.createFromVersionSpec(range).containsVersion(ArtifactVersion.of(version));
} 
