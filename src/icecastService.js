async function getListeners() {
  const response = await fetch('/wp-json/icemap/v1/listeners');
  const data = await response.json();
  return data;
}

export default { getListeners };
