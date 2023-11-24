//buttons.js

class Buttons{
    constructor(page){
        this.page = page

        const ids = [
            'trialSlider', 'colorbarLabel', 'channelDisplay', 'ANOVAbutton',
            'meanTrialsButton', 'excludeTrialButton',
            'prevChan', 'nextChan', 'yAxisLabel', 'trialNumber',
        ];
        
        ids.forEach(id => {
            this[id] = document.getElementById(id);
        });

        this.inlineButtons = [
            this.ANOVAbutton, 
            this.meanTrialsButton, 
            this.excludeTrialButton, 
            this.trialNumber, 
            this.trialSlider, 
            this.prevChan, 
            this.nextChan
        ];

        this.flexButtons = [
            this.yAxisLabel, 
            this.colorbarLabel, 
        ]
    
    }
    updateDisplayStyle(elements, displayStyle) {
        elements.forEach(element => {
            element.style.display = displayStyle;
        });
    }
        

    set_stimButtons(){
        const groupButtons = document.querySelectorAll('.groupButton');
        const stimGroups = document.querySelectorAll('.stimGroup')
        
        stimGroups.forEach(button => {
            button.addEventListener('click', (event) => {
                document.title = document.getElementById('channelDisplay').textContent;
                document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
                document.getElementById('indexView').style.display = 'none';
                document.getElementById('heatmapView').style.display = 'block';

                this.updateDisplayStyle(this.inlineButtons, 'none');
                this.updateDisplayStyle(this.flexButtons, 'none');
                this.trialSlider.previousElementSibling.textContent = ''

                this.page.stimGroup = event.target.textContent
                this.allGroups = this.page.groupTypes[this.page.stimGroup]
                
                console.log(this.allGroups)
                this.page.excludedTrialsContainer = {}

                groupButtons.forEach((button,index) => {

                    button.textContent = this.allGroups[index];
                    this.page.excludedTrialsContainer[button.textContent] = this.page.excludedContainers[index];
                    console.log(this.page.excludedTrialsContainer)
                    button.addEventListener('click', async (event) => {
                        groupButtons.forEach(btn => btn.classList.remove('active'));
        
                        event.target.classList.add('active'); 
        
                        this.page.group = event.target.textContent;
                        this.page.trial = 1;
                    

                        this.page.excludedContainers.forEach(container => container.style.display = 'none');
                        this.page.excludedTrialsContainer[this.page.group].style.display = 'flex'
        
                        await this.page.getData();
                
                        this.trialSlider.previousElementSibling.textContent = 'Trial:'
                        this.channelDisplay.textContent = 'Channel 1' 
                        this.updateDisplayStyle(this.inlineButtons, 'inline-block');
                        this.updateDisplayStyle(this.flexButtons, 'flex');

                    });
             
                    
                })
              
            })
        })
    }
  
    
}
    
window.Buttons = Buttons;