/* Plain script: works offline from file:// and in the Node test runner. */
globalThis.CampusKit = (() => {
  function kit(request, loans, assets) {
    const lines = request.items.map(type => {
      const matching = loans.filter(l => l.req === request.id && assets.find(a => a.id === l.asset)?.type === type);
      return {type, loans: matching, state: matching.some(l => !l.back) ? 'Outstanding' : matching.length ? 'Returned' : 'Not yet issued'};
    });
    const total = lines.length;
    const returned = lines.filter(l => l.state === 'Returned').length;
    const started = lines.some(l => l.loans.length);
    return {lines, total, returned, status: !started ? 'Not started' : returned === total ? 'Complete' : returned ? 'Partly returned' : 'Out'};
  }
  return {kit};
})();
