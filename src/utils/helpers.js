export const slugify = (val) => {
  if (!val) return ''
  return String(val)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // remove consecutive hyphens
}


export const generatePlaceholderCard = (column) => {
    return {
      _id: `${column._id}-placeholder-card`,
      boardId: column.boardId,
      columnId: column._id,
      FE_PlaceholderCard: true
    }
}

export const sanitizeFilename = (filename) => {
    const sanitized = filename
      .replace(/[()]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    return sanitized;
  };