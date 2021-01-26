import { ActorRdfResolveHypermediaLinks } from '@comunica/bus-rdf-resolve-hypermedia-links';
import { Bus } from '@comunica/core';
import { ActorRdfResolveHypermediaLinksTreeAll } from '../lib/ActorRdfResolveHypermediaLinksTreeAll';

describe('ActorRdfResolveHypermediaLinksTreeAll', () => {
  let bus: any;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorRdfResolveHypermediaLinksTreeAll module', () => {
    it('should be a function', () => {
      expect(ActorRdfResolveHypermediaLinksTreeAll).toBeInstanceOf(Function);
    });

    it('should be a ActorRdfResolveHypermediaLinksTreeAll constructor', () => {
      expect(new (<any>ActorRdfResolveHypermediaLinksTreeAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinksTreeAll);
      expect(new (<any>ActorRdfResolveHypermediaLinksTreeAll)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorRdfResolveHypermediaLinks);
    });

    it('should not be able to create new ActorRdfResolveHypermediaLinksTreeAll objects without \'new\'', () => {
      expect(() => { (<any>ActorRdfResolveHypermediaLinksTreeAll)(); }).toThrow();
    });
  });

  describe('An ActorRdfResolveHypermediaLinksTreeAll instance', () => {
    let actor: ActorRdfResolveHypermediaLinksTreeAll;

    beforeEach(() => {
      actor = new ActorRdfResolveHypermediaLinksTreeAll({ name: 'actor', bus });
    });

    it('should test on next metadata', () => {
      return expect(actor.test({ metadata: { next: 'NEXT' }})).resolves.toBeTruthy();
    });

    it('should test on treeProperties metadata', () => {
      const treeProperties = { relations: [{ 'tree:node': 'node' }]};
      return expect(actor.test({ metadata: { treeProperties }})).resolves.toBeTruthy();
    });

    it('should not test without next metadata', () => {
      return expect(actor.test({ metadata: {}})).rejects
        .toThrow();
    });

    it('should run', () => {
      return expect(actor.run({ metadata: { next: 'NEXT' }})).resolves.toMatchObject({ urls: [ 'NEXT' ]});
    });

    it('should run on treeProperties metadata', () => {
      const relations = new Map();
      relations.set('_', { 'tree:node': 'node' });
      const treeProperties = { relations };
      return expect(actor.run({ metadata: { treeProperties }})).resolves.toMatchObject({ urls: [ 'node' ]});
    });
  });
});
