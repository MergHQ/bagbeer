export const getCurrentStatus = () =>
  fetch(process.env.NEXT_STATUS_API_URL)
    .then(res => res.ok ? res.json() : 'Error fetching status')
