document.addEventListener('DOMContentLoaded', () => {
    const state = {
        currentQuestion: 1,
        totalQuestions: 5
    };
    
    const elements = {
        nextBtn: document.getElementById('nextBtn'),
        prevBtn: document.getElementById('prevBtn'),
        progress: document.getElementById('progress'),
        questionCounter: document.getElementById('question-counter'),
        questions: Array.from({ length: 5 }, (_, i) => document.getElementById(`q${i + 1}`)),
        questionnaire: document.getElementById('questionnaire'),
        skinQuestionsForm: document.getElementById('skinQuestions'),
        cameraSection: document.getElementById('camera-section')
    };

    // Remove the form's default action and method
    elements.skinQuestionsForm.removeAttribute('action');
    elements.skinQuestionsForm.removeAttribute('method');

    // Check localStorage for saved progress
    const loadSavedAnswers = () => {
        try {
            const savedData = localStorage.getItem('skinQuestionsProgress');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // Populate form fields with saved values
                if (parsedData.age) document.querySelector('select[name="age"]').value = parsedData.age;
                if (parsedData.skinFeel) document.querySelector('select[name="skinFeel"]').value = parsedData.skinFeel;
                if (parsedData.breakouts) document.querySelector('select[name="breakouts"]').value = parsedData.breakouts;
                if (parsedData.sensitivity) document.querySelector('select[name="sensitivity"]').value = parsedData.sensitivity;
                if (parsedData.concern) document.querySelector('select[name="concern"]').value = parsedData.concern;
                
                console.log('Loaded saved progress:', parsedData);
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    };
    
    // Save current answers to localStorage
    const saveProgress = () => {
        try {
            const currentData = {
                age: document.querySelector('select[name="age"]').value || '',
                skinFeel: document.querySelector('select[name="skinFeel"]').value || '',
                breakouts: document.querySelector('select[name="breakouts"]').value || '',
                sensitivity: document.querySelector('select[name="sensitivity"]').value || '',
                concern: document.querySelector('select[name="concern"]').value || '',
                lastQuestion: state.currentQuestion
            };
            
            localStorage.setItem('skinQuestionsProgress', JSON.stringify(currentData));
            console.log('Progress saved:', currentData);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };
    
    // Load saved answers on page load
    loadSavedAnswers();

    function updateProgress() {
        const progressPercentage = ((state.currentQuestion - 1) / state.totalQuestions) * 100;
        elements.progress.style.width = `${progressPercentage}%`;
        elements.questionCounter.textContent = `Question ${state.currentQuestion} of ${state.totalQuestions}`;
        
        // Save progress when changing questions
        saveProgress();
    }
    
    function showQuestion(questionNumber) {
        elements.questions.forEach((q, index) => {
            q.classList.remove('active');
            if (index + 1 === questionNumber) {
                q.classList.add('active');
            }
        });
    
        elements.prevBtn.style.display = questionNumber === 1 ? 'none' : 'block';
        elements.nextBtn.textContent = questionNumber === state.totalQuestions ? 'Submit' : 'Next';
        updateProgress();
    }

    function submitForm() {
        // Create the data object manually
        const formData = {
            age: document.querySelector('select[name="age"]').value,
            skinFeel: document.querySelector('select[name="skinFeel"]').value,
            breakouts: document.querySelector('select[name="breakouts"]').value,
            sensitivity: document.querySelector('select[name="sensitivity"]').value,
            concern: document.querySelector('select[name="concern"]').value
        };

        // Validate data before sending
        for (let key in formData) {
            if (!formData[key]) {
                alert('Please fill all fields');
                return;
            }
        }

        console.log('Preparing to send data:', formData);

        // Save completion status - use only one consistent key
        localStorage.setItem('questionnaireCompleted', 'true');
        console.log('Set localStorage flag: questionnaireCompleted = true');
        
        console.log('Sending POST request to /analyze');
        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success response from server:', data);
            
            // Use the same localStorage key here - remove the duplicate
            // localStorage.setItem('skinQuestionsCompleted', 'true');
            
            // Redirect to process page instead of directly to face scan
            console.log('Redirecting to /process');
            window.location.href = '/process';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error submitting form');
        });
    }
    
    elements.nextBtn.addEventListener('click', function() {
        const currentSelect = document.querySelector('.question-container.active select');
        if (!currentSelect || !currentSelect.value) {
            alert('Please select an option');
            return;
        }

        // Save current progress
        saveProgress();

        if (state.currentQuestion < state.totalQuestions) {
            state.currentQuestion++;
            showQuestion(state.currentQuestion);
        } else {
            submitForm();
        }
    });
    
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentQuestion > 1) {
            state.currentQuestion--;
            showQuestion(state.currentQuestion);
        }
    });

    // Prevent the default form submission
    elements.skinQuestionsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        return false;
    });

    // Try to restore last question viewed
    try {
        const savedData = JSON.parse(localStorage.getItem('skinQuestionsProgress'));
        if (savedData && savedData.lastQuestion) {
            state.currentQuestion = parseInt(savedData.lastQuestion, 10) || 1;
        }
    } catch (error) {
        console.error('Error restoring last question:', error);
    }

    showQuestion(state.currentQuestion);
});