import java.awt.*;  
import java.applet.Applet;  
import java.util.Random; 

public class Tank_creep extends Creep 
{
    public Tank_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
	
	public Tank_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
    
    public Tank_creep(int x, int y, int h, int s, int c, int d)
    {
    	super(x, y, h, s, c, d);
    }
    
    public void drawCreep(Graphics g)
    {
	    if(health > 0)
	    {
	    	if(hurt)
	    	{
	    		g.setColor(Color.gray);
	    		hurt = !hurt;
	    	}
	    	else if(burned > 0)
	    		g.setColor(Color.orange);
	    	else if(frozen > 0)
	    		g.setColor(Color.cyan);
	    	else
	    		g.setColor(new Color(175,0,255));

	    	if(visible)
	    		g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.black);
	    	g.drawArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));

			
			g.setColor(Color.blue);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString("#",getX()-(2/diviser),getY()+(2/diviser));

	    	g.setColor(Color.green);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString(""+health,getX()-(10/diviser),getY()-(20/diviser));

	    	if(animate == 0)
	    		g.fillOval(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser));

	    	if(animation >= 30)
	    		animate = -1;

	    	if(animation <= -0)
	    		animate = 1;

	    	animation += animate*10;
	    }
	    else
	    {
	    	if(animation >= 0)
			{
				g.setColor(Color.gray);
				g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), 90+(180-animation*15), 360-(360-animation*30));

		    	animation --;
			}
	    }
    }
}