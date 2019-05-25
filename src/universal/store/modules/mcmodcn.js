import querystring from 'querystring';
import parser from 'fast-html-parser';
import request from '../../utils/request';


/**
 * 
 * @param {parser.Node} n 
 */
function parseFrame(n) {
    const block = n.firstChild;
    const items = n.lastChild;
    let image = block.firstChild.firstChild.attributes.src;
    if (image.startsWith('/')) {
        image = `http://www.mcmod.cn${image}`;
    }
    const url = block.firstChild.attributes.href;
    return {
        image,
        url,
        id: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')),
        title: block.firstChild.attributes.title,
        view: block.lastChild.lastChild.firstChild.attributes.title.substring(3),
        likes: block.lastChild.lastChild.childNodes[1].attributes.title.substring(3),
        favor: block.lastChild.lastChild.childNodes[2].attributes.title.substring(3),
        items: items.firstChild.classNames[0] === 'noitems' ? [] : items.childNodes.map(c => ({
            id: c.attributes.iid,
            url: c.childNodes[1].attributes.href,
            image: c.childNodes[1].firstChild.attributes.src,
        })),
    };
}

/**
 * 
 * @param {parser.HTMLElement} root 
 */
function parseAllClass(root) {
    return root.querySelectorAll('.class_block').map(node => node.removeWhitespace())
        .filter(node => node.childNodes.length === 2
            && node.firstChild.classNames[0] === 'left'
            && node.lastChild.classNames[0] === 'right'
            && node.firstChild.firstChild.firstChild.classNames[1] !== 'today')
        .map((node) => {
            const left = node.firstChild;
            const right = node.lastChild;
            const titleDetail = left.firstChild.firstChild;
            return {
                title: titleDetail.lastChild.text,
                url: titleDetail.lastChild.attributes.href,
                description: titleDetail.attributes.title,
                list: left.lastChild.childNodes.map(parseFrame),
            };
        });
}

function parseNews(root) {
    const news = root.querySelector('.news_block').removeWhitespace();
    const newsMods = news.childNodes[1].childNodes.map((node) => {
        if (node.childNodes.length === 2) {
            return {
                image: node.childNodes[0].childNodes[0].attributes.src,
                url: node.childNodes[0].attributes.href,
                title: node.childNodes[0].attributes.title,
            };
        }
        return {
            image: node.childNodes[1].childNodes[0].attributes.src,
            url: node.childNodes[1].attributes.href,
            title: node.childNodes[1].attributes.title,
        };
    });
    return newsMods;
}


export default {
    namespaced: true,
    actions: {
        /**
         * 
         * @param {vuex.ActionContext} context 
         */
        viewRandom(context) {
            const parse = (randomSection) => {
                randomSection = randomSection.removeWhitespace();
                return randomSection.childNodes.map(parseFrame);
            };
            return request({
                method: 'POST',
                url: 'http://www.mcmod.cn/ajax/index/ajax___index_random.php',
                headers: {
                    Host: 'www.mcmod.cn',
                    Origin: 'http://www.mcmod.cn',
                    Referer: 'http://www.mcmod.cn/',
                },
            }, parse);
            // return context.dispatch('query', {
            //     service: 'mcmod',
            //     action: 'fetchRandom',
            // }, { root: true })
        },
        /**
         * 
         * @param {vuex.ActionContext} context 
         */
        view(context) {
            return request('http://www.mcmod.cn', root => ({
                news: parseNews(root),
                content: parseAllClass(root),
            }));
        },
        /**
         * 
         * @param {vuex.ActionContext} context 
         */
        detail(context, id) {
            const url = `http://www.mcmod.cn/class/${id}.html`;
            return request(url, (pageCont) => {
                pageCont = pageCont.removeWhitespace();
                const infoBlock = pageCont.querySelector('.InfoBlock');
                const title = pageCont.querySelector('.title');
                const modimg = pageCont.querySelector('.class_modimg');
                const classEx = pageCont.querySelector('.class_ex');
                const modDescription = pageCont.querySelector('.right_inside');
                let image = modimg.attributes.src;
                if (image.startsWith('/')) {
                    image = `http://www.mcmod.cn${image}`;
                }
                const linksList = infoBlock.childNodes[8].lastChild
                    .lastChild;

                return {
                    title: title.childNodes[1].text,
                    subTitle: title.childNodes[2].text,
                    // likes: title.childNodes[3].childNodes[0].lastChild.text,
                    popularity: classEx.childNodes[0].childNodes[0].childNodes[0].text,
                    popularityType: classEx.childNodes[0].childNodes[0].childNodes[1].text,
                    lastDayCount: classEx.childNodes[0].childNodes[2].text,
                    averageCount: classEx.childNodes[0].childNodes[3].text,
                    browseCount: classEx.childNodes[1].childNodes[0].childNodes[0].text,
                    recommendCount: classEx.childNodes[1].childNodes[1].childNodes[0].text,
                    image,
                    modType: infoBlock.childNodes[0].lastChild.text,
                    recordTime: infoBlock.childNodes[1].text,
                    author: infoBlock.childNodes[2].text,
                    lastModifiedTime: infoBlock.childNodes[3].text,
                    mod: infoBlock.childNodes[4].text,
                    lastRecommendTime: infoBlock.childNodes[5].text,
                    modifyCount: infoBlock.childNodes[6].text.replace('\r\n', '').replace(/ /g, ''),
                    relevantLinks: linksList.childNodes.map(val => val.lastChild.attributes.href),
                    modDescription: modDescription.childNodes[0].childNodes[0]
                        .childNodes[0].childNodes[0].text,
                };
            });
            // return context.dispatch('query', {
            //     service: 'mcmod',
            //     action: 'fetchDetail',
            //     payload: `http://www.mcmod.cn/class/${id}.html`,
            // }, { root: true })
        },
    },
};
