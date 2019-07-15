

function create(slim) {
    return decoratePos(decorateDimension(group(slim)));
}

function calculate(model) {
    const pixRatio = 1 / 32;
    return {
        h: Math.abs(model.front[1] - model.front[3]) * pixRatio,
        w: Math.abs(model.front[0] - model.front[2]) * pixRatio,
        d: Math.abs(model.right[0] - model.right[2]) * pixRatio,
    };
}
function group(slim) {
    return {
        head: {
            layer: {
                w: 9,
                h: 9,
                d: 9,
                top: [40, 0, 48, 8],
                bottom: [48, 0, 56, 8],
                right: [32, 8, 40, 16],
                front: [40, 8, 48, 16],
                left: [48, 8, 56, 16],
                back: [56, 8, 64, 16],
            },
            top: [8, 0, 16, 8],
            bottom: [24, 8, 16, 0],
            right: [0, 8, 8, 16],
            front: [8, 8, 16, 16],
            left: [16, 8, 24, 16],
            back: [24, 8, 32, 16],
        },
        rightLeg: {
            layer: {
                w: 4.5,
                d: 4.5,
                h: 13.5,
                top: [4, 48, 8, 36],
                bottom: [8, 48, 12, 36],
                right: [0, 36, 4, 48],
                front: [4, 36, 8, 48],
                left: [8, 36, 12, 48],
                back: [12, 36, 16, 48],
            },
            top: [4, 16, 8, 20],
            bottom: [8, 16, 12, 20],
            right: [0, 20, 4, 32],
            front: [4, 20, 8, 32],
            left: [8, 20, 12, 32],
            back: [12, 20, 16, 32],
        },
        torso: {
            layer: {
                w: 9,
                h: 13.5,
                d: 4.5,
                top: [20, 48, 28, 36],
                bottom: [28, 48, 36, 36],
                right: [16, 36, 20, 48],
                front: [20, 36, 28, 48],
                left: [28, 36, 32, 48],
                back: [32, 36, 40, 48],
            },
            top: [20, 16, 28, 20],
            bottom: [28, 16, 36, 20],
            right: [16, 20, 20, 32],
            front: [20, 20, 28, 32],
            left: [28, 20, 32, 32],
            back: [32, 20, 40, 32],
        },
        leftArm: {
            layer: {
                w: 4.5,
                h: 13.5,
                d: 4.5,
                top: [52, 48, 56, 52],
                bottom: [56, 48, 60, 52],
                right: [48, 52, 52, 64],
                front: [52, 52, 56, 64],
                left: [56, 52, 60, 64],
                back: [60, 52, 64, 64],
            },

            top: [36, 48, slim ? 39 : 40, 52],
            bottom: [slim ? 39 : 40, 48, slim ? 42 : 44, 52],
            left: [32, 52, 36, 64],
            front: [36, 52, slim ? 39 : 40, 64],
            right: [slim ? 39 : 40, 52, slim ? 43 : 44, 64],
            back: [slim ? 43 : 44, 52, slim ? 46 : 48, 64],
        },
        rightArm: {
            layer: {
                w: 4.5,
                h: 13.5,
                d: 4.5,
                top: [44, 48, 48, 36],
                bottom: [48, 48, 52, 36],
                left: [48, 36, 52, 48],
                front: [44, 36, 48, 48],
                right: [40, 36, 44, 48],
                back: [52, 36, 64, 48],
            },
            top: [44, 16, slim ? 47 : 48, 20],
            bottom: [slim ? 47 : 48, 16, slim ? 50 : 52, 20],
            left: [40, 20, 44, 32],
            front: [44, 20, slim ? 47 : 48, 32],
            right: [slim ? 47 : 48, 20, slim ? 51 : 52, 32],
            back: [slim ? 51 : 52, 20, slim ? 54 : 56, 32],
        },
        leftLeg: {
            layer: {
                w: 4.5,
                d: 4.5,
                h: 13.5,
                top: [4, 48, 8, 52],
                bottom: [8, 48, 12, 52],
                right: [0, 52, 4, 64],
                front: [4, 52, 8, 64],
                left: [8, 52, 12, 64],
                back: [12, 52, 16, 64],
            },
            top: [20, 48, 24, 52],
            bottom: [24, 48, 28, 52],
            right: [16, 52, 20, 64],
            front: [20, 52, 24, 64],
            left: [24, 52, 28, 64],
            back: [28, 52, 32, 64],
        },

        cape: {
            top: [1, 0, 11, 1],
            bottom: [11, 0, 21, 1],
            left: [11, 1, 12, 17],
            front: [12, 1, 22, 17],
            right: [0, 1, 1, 17],
            back: [1, 1, 11, 17],
        },
    };
}
function decorateDimension(group) {
    const pixRatio = 1 / 32;
    Object.keys(group).map(k => group[k]).forEach((part) => {
        Object.assign(part, calculate(part));
        if (part.layer) {
            part.layer.w *= pixRatio;
            part.layer.h *= pixRatio;
            part.layer.d *= pixRatio;
        }
    });
    return group;
}

function decoratePos(group) {
    const charH = 1;
    group.head.y = charH - group.head.h / 2;

    group.torso.y = group.rightLeg.h + group.torso.h / 2;

    group.rightLeg.x = -group.rightLeg.w / 2;
    group.rightLeg.y = group.rightLeg.h / 2;
    group.leftLeg.x = group.leftLeg.w / 2;
    group.leftLeg.y = group.leftLeg.h / 2;

    group.rightArm.x = -group.torso.w / 2 - group.rightArm.w / 2;
    group.rightArm.y = group.rightLeg.h + group.torso.h - group.rightArm.h / 2;

    group.leftArm.x = group.torso.w / 2 + group.leftArm.w / 2;
    group.leftArm.y = group.leftLeg.h + group.torso.h - group.leftArm.h / 2;

    group.cape.y = group.rightLeg.h + group.torso.h / 5 * 2;
    group.cape.z = -group.torso.d * 3 / 2;
    return group;
}

export default {
    steve: create(false),
    alex: create(true),
};
