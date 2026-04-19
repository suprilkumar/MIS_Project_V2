// utils/helpers.js

export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return dateStr;
    } catch {
        return dateStr;
    }
};

export const getMonthYear = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const month = parts[1];
            const year = parts[2];
            const date = new Date(year, parseInt(month) - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
};

export const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const getGenderLabel = (gender) => {
    if (gender === 'M') return 'Male';
    if (gender === 'F') return 'Female';
    return gender;
};

export const getCategoryLabel = (category) => {
    const labels = {
        'GEN': 'General',
        'SC': 'SC',
        'ST': 'ST',
        'OBC': 'OBC'
    };
    return labels[category] || category;
};

export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

export const downloadCSV = (data, filename) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};