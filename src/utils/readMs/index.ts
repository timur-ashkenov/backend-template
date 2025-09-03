type MsAttribute = { name?: string; id?: string; value?: unknown };

export function readMsAttr(row: any, nameOrId: string): unknown {
  const attrs: MsAttribute[] | undefined = row?.attributes;
  if (!Array.isArray(attrs)) return undefined;

  const byId = attrs.find(a => a?.id === nameOrId);
  if (byId) return byId.value;

  const byName = attrs.find(a => a?.name === nameOrId);
  return byName?.value;
}