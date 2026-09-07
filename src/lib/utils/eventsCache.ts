import NodeCache from 'node-cache';

const eventsCache = new NodeCache({ stdTTL: 300 });

export default eventsCache;
