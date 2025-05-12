const styleGrid = document.getElementById('styleGrid');
const hiddenInput = document.getElementById('style');

styleGrid.addEventListener('click', (event) => {
    const clickedOption = event.target.closest('.style-option');
    if (clickedOption) {
        // Remove 'selected' class from all options
        document.querySelectorAll('.style-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add 'selected' class to the clicked option
        clickedOption.classList.add('selected');

        // Update the hidden input value
        hiddenInput.value = clickedOption.dataset.value;
    }
});