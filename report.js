const supabase = require('./supabase');

async function getReport(userId) {

const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

const { data, error } = await supabase
.from('activity_logs')
.select('*')
.eq('user_id', userId)
.gte('created_at', fiveDaysAgo.toISOString())
.order('created_at', { ascending: false });

if (error) {
console.error(error);
return 'Report Error ❌';
}

if (!data || data.length === 0) {
return 'No activity found in last 5 days';
}

let totalDistance = 0;
let totalMinutes = 0;

const activitySummary = {};

let report = '📊 Activity Report (Last 5 Days)\n\n';

data.forEach(row => {

```
const date = new Date(row.created_at)
  .toLocaleDateString('en-GB');

report +=
```

`Date : ${date}
Activity : ${row.activity}
Detail : ${row.detail ?? '-'}
Time : ${row.duration ?? '-'} ${row.duration_unit ?? ''}
Distance : ${row.distance ?? '-'} ${row.distance_unit ?? ''}

`;

```
if (row.distance) {
  totalDistance += Number(row.distance);
}

if (row.duration) {

  if (row.duration_unit === 'hr') {
    totalMinutes += Number(row.duration) * 60;
  } else {
    totalMinutes += Number(row.duration);
  }

}

const activity = row.activity || 'unknown';

activitySummary[activity] =
  (activitySummary[activity] || 0) + 1;
```

});

const totalHours = Math.floor(totalMinutes / 60);
const remainMinutes = totalMinutes % 60;

report += '--------------------\n';
report += '📈 Summary\n\n';

report += `Total Activities : ${data.length}\n`;
report += `Total Distance : ${totalDistance} km\n`;
report += `Total Time : ${totalHours} hr ${remainMinutes} min\n\n`;

report += '🏃 Activity Breakdown\n';

Object.entries(activitySummary).forEach(([activity, count]) => {
report += `${activity} : ${count}\n`;
});

return report;
}

module.exports = {
getReport
};

module.exports = {
  getReport
};