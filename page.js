// page.js
class Page{
    constructor() {
        this.args = {
            trial: 1,
            channel: 1,
            meanTrials: false,
        }
        
        this.frequencyBins = [
            { min: 60, max: 200 },
            { min: 20, max: 60 },
            { min: 0, max: 20 }
        ];
    
        this.containers= ['#container1', '#container2', '#container3'];
        
        document.getElementById("y-axis-label").style.display = "none" // Hide "Frequency (Hz)" y-axis-label while Loading...
        document.getElementById('channelDisplay').textContent = 'Channel 1';

        this.setGroup();

        const prevChan = document.getElementById('previousChannel');
        prevChan.addEventListener('click', () => {
        if (this.args.channel > 1) {
                this.args.channel--;
                document.getElementById('channelDisplay').textContent = 'Channel' + this.args.channel;
                this.getData();
            }
        })
        
        const nextChan = document.getElementById('nextChannel');
        nextChan.addEventListener('click', () => {
            this.args.channel++;
            document.getElementById('channelDisplay').textContent = 'Channel' + this.args.channel;
            this.getData();
           
        })
    }
    
    setGroup() {
        const groupButtons = document.querySelectorAll('.groupButton');
        groupButtons.forEach(button => {
            button.addEventListener('click', (event) => { // Use arrow function here
                // Remove 'active' class from all group buttons
                groupButtons.forEach(btn => btn.classList.remove('active'));
        
                // Add 'active' class to clicked button
                event.target.classList.add('active'); 
        
                // Set the group based on button's text content
                this.args.group = event.target.textContent;
                this.args.trial = 1;
                this.getData();
            });
        });
    }

    async getData() {
        
        
        document.getElementById('trialSlider').disabled = true;
        document.getElementById("loadingText").style.display = "block";  // Display "Loading..."
    
        const response = await fetch(`https://froyzen.pythonanywhere.com/`, {
        // const response = await fetch(`http://localhost:5000/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.args)
        })
        const responseData = await response.json();
        
        this.allTrialsData = responseData.trials_data;
        this.singleTrialData = this.allTrialsData[this.args.trial];
        
        document.getElementById('trialNumber').textContent = this.args.trial
        document.getElementById('trialSlider').value = this.args.trial
        document.getElementById('trialSlider').max = Object.keys(this.allTrialsData).length;
        document.getElementById('trialSlider').disabled = false;

        
        document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
        document.getElementById("y-axis-label").style.display = "block" // Display "Frequency (Hz)"

        this.setContainers();
    }

    setContainers() {
        this.containers.forEach((container,index) => {
            const freqBin = this.frequencyBins[index];
            const heatmap = new window.Heatmap(this,container,freqBin);
            heatmap.initialize();
            const colorbar = new window.Colorbar(heatmap);
            colorbar.initColorbar();
        })
    }

    setAverageButton(){
        const meanTrialsButton = document.getElementById('meanTrialsButton');
        meanTrialsButton.addEventListener('click', async () => {
            if (this.args.meanTrials === true) {
                this.args.meanTrials = false;
            } else {
                this.args.meanTrials = true;
            }
            await this.getData();
            this.setContainers
        });    
    }
}

window.Page = Page;
const page = new window.Page;
// page.setAverageButton();

