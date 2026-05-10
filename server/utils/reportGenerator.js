/**
 * Generates the HTML report for DayFlow tasks.
 */

// Simple pseudo-random motivation lines from Leva
const LEVA_QUOTES = [
  "You're doing amazing! Keep building those habits! 🌟",
  "Every small step counts. I'm so proud of you! 💪",
  "Take a deep breath and keep flowing! You've got this! ✨",
  "Consistency is your superpower! Have a great day! 🚀"
];

function getAccuracy(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function getTopCategories(tasks) {
  const counts = {};
  tasks.filter(t => t.completed).forEach(t => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => ({ category: entry[0], count: entry[1] }));
}

function generateAsciiBar(percentage) {
  const totalBlocks = 10;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

function generateBreakdownHtml(tasks, timeframe) {
  // Group by date
  const groups = {};
  tasks.forEach(t => {
    if (!groups[t.date]) groups[t.date] = { total: 0, completed: 0 };
    groups[t.date].total++;
    if (t.completed) groups[t.date].completed++;
  });

  const sortedDates = Object.keys(groups).sort();
  
  if (sortedDates.length === 0) {
    return '<p style="color: #6060a0;">No tasks tracked in this period.</p>';
  }

  let html = `<table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; margin: 20px 0;">`;
  html += `<tr style="border-bottom: 1px solid #e0e0e0; text-align: left;"><th style="padding: 8px;">Date</th><th style="padding: 8px;">Accuracy</th><th style="padding: 8px;">Chart</th></tr>`;
  
  sortedDates.forEach(date => {
    const stat = groups[date];
    const acc = Math.round((stat.completed / stat.total) * 100);
    const bar = generateAsciiBar(acc);
    html += `<tr>
      <td style="padding: 8px;">${date}</td>
      <td style="padding: 8px; color: ${acc >= 70 ? '#00e87a' : acc >= 40 ? '#f0a020' : '#ff3355'}">${acc}%</td>
      <td style="padding: 8px; color: #9b5cff">${bar}</td>
    </tr>`;
  });
  html += `</table>`;
  
  return html;
}

function generateReportHtml(timeframe, userName, tasks) {
  const accuracy = getAccuracy(tasks);
  const topCategories = getTopCategories(tasks);
  const breakdownHtml = generateBreakdownHtml(tasks, timeframe);
  
  const quote = LEVA_QUOTES[Math.floor(Math.random() * LEVA_QUOTES.length)];

  return `
    <div style="font-family: 'Space Grotesk', sans-serif, Arial; max-width: 600px; margin: 0 auto; background-color: #07071a; color: #e2e2ff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
      <h2 style="color: #00d4ff; margin-top: 0;">Hi ${userName},</h2>
      <p style="font-size: 16px;">Here is your DayFlow <strong>${timeframe}</strong> summary!</p>
      
      <div style="background-color: #0e0e28; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #252550;">
        <h3 style="margin-top: 0; color: #9b5cff;">Overall Accuracy</h3>
        <div style="font-size: 32px; font-weight: bold; color: ${accuracy >= 70 ? '#00e87a' : accuracy >= 40 ? '#f0a020' : '#ff3355'};">
          ${accuracy}%
        </div>
      </div>

      <div style="background-color: #0e0e28; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #252550;">
        <h3 style="margin-top: 0; color: #9b5cff;">Daily Breakdown</h3>
        ${breakdownHtml}
      </div>

      <div style="background-color: #0e0e28; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #252550;">
        <h3 style="margin-top: 0; color: #9b5cff;">Top Completed Categories</h3>
        ${topCategories.length > 0 ? `
          <ul style="padding-left: 20px; margin: 0;">
            ${topCategories.map((c, i) => `<li style="margin-bottom: 5px;">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} <strong>${c.category}</strong> (${c.count} tasks)</li>`).join('')}
          </ul>
        ` : '<p style="margin: 0; color: #6060a0;">No tasks completed yet.</p>'}
      </div>

      <hr style="border: 0; border-top: 1px solid #252550; margin: 30px 0;" />
      
      <p style="font-size: 16px; font-style: italic; color: #00d4ff;">
        "${quote}"
      </p>
      <p style="font-size: 14px; color: #6060a0; margin-bottom: 0;">
        — Leva
      </p>
    </div>
  `;
}

module.exports = {
  generateReportHtml
};
