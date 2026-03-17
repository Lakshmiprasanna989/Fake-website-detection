document.addEventListener('DOMContentLoaded', () => {
    // Select necessary DOM elements
    const form = document.getElementById('detection-form');
    const urlInput = document.getElementById('url-input');
    const checkBtn = document.getElementById('check-btn');
    const resultContainer = document.getElementById('result-container');
    const statusBadge = document.getElementById('status-badge');
    const resultTitle = document.getElementById('result-title');
    const reasonsList = document.getElementById('reasons-list');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        // Prevent default page reload
        e.preventDefault();

        let url = urlInput.value.trim();
        
        // 1. Basic frontend validation
        if (!url) {
            alert("Please enter a URL.");
            return;
        }

        // Try to fix missing protocol to make URL parser happy
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            // Also update the input field so the user sees the corrected URL
            urlInput.value = url;
        }

        // Test if URL format is generally valid via browser built-in constructor
        try {
            new URL(url);
        } catch (err) {
            alert("Please enter a valid format for the URL (e.g., https://example.com)");
            return;
        }

        // 2. Set UI loading state
        checkBtn.classList.add('btn-loading');
        checkBtn.disabled = true;
        resultContainer.classList.add('hidden');

        // 3. Perform Fetch API call to Python/Flask backend
        try {
            const response = await fetch('/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error("Server error or bad request");
            }

            const data = await response.json();
            
            // 4. Update UI with the result dynamically
            displayResult(data);

        } catch (error) {
            console.error("Error detecting URL:", error);
            alert("An error occurred while checking the website. Ensure the Flask server is running.");
        } finally {
            // Restore button state
            checkBtn.classList.remove('btn-loading');
            checkBtn.disabled = false;
        }
    });

    // Function to render the results into the UI
    function displayResult(data) {
        // Reset old list
        reasonsList.innerHTML = '';
        
        // Use JSON response to choose badge colors and titles
        if (data.status === 'safe') {
            statusBadge.textContent = 'Safe';
            statusBadge.className = 'badge safe';
            resultTitle.textContent = 'Website looks safe';
            resultTitle.className = 'text-safe';
            const confidence = document.createElement("p");
confidence.innerHTML = "Confidence Score: <b>" + data.confidence + "%</b>";
resultContainer.appendChild(confidence);
        } else {
            statusBadge.textContent = 'Suspicious';
            statusBadge.className = 'badge fake';
            resultTitle.textContent = 'Potential Fake Website';
            resultTitle.className = 'text-fake';
            const confidence = document.createElement("p");
confidence.innerHTML = "Confidence Score: <b>" + data.confidence + "%</b>";
resultContainer.appendChild(confidence);
        }

        // Populate list items with the reasons returned by the backend
        if (data.reasons && data.reasons.length > 0) {
            data.reasons.forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                reasonsList.appendChild(li);
            });
        }

        // Remove the hidden class to animate results into view
        resultContainer.classList.remove('hidden');
    }
});
