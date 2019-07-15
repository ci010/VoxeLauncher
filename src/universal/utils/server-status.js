export const UNKNOWN_STATUS = Object.freeze({
    version: {
        name: 'profile.server.unknown',
        protocol: -1,
    },
    players: {
        max: -1,
        online: -1,
    },
    description: 'profile.server.unknownDescription',
    favicon: '',
    ping: 0,
});

export const PINGING_STATUS = Object.freeze({
    version: {
        name: 'profile.server.ping',
        protocol: -1,
    },
    players: {
        max: -1,
        online: -1,
    },
    description: 'profile.server.pinging',
    favicon: '',
    ping: 0,
});

/**
 * 
 * @param {string} description 
 */
export function createFailureServerStatus(description) {
    return Object.freeze({
        version: {
            name: 'profile.server.unknown',
            protocol: -1,
        },
        players: {
            max: -1,
            online: -1,
        },
        description,
        favicon: '',
        ping: -1,
    });
}
