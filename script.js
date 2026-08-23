function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('block');
    });

    // Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-[#313244]', 'text-white');
        item.classList.add('text-gray-300');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('block');
    }

    // Set active state on clicked nav item
    const clickedItem = event.currentTarget;
    if (clickedItem) {
        clickedItem.classList.remove('text-gray-300');
        clickedItem.classList.add('bg-[#313244]', 'text-white');
    }
}
