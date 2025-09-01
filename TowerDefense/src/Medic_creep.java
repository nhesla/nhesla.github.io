import java.awt.*;  
import java.applet.Applet;
import java.util.Random;

public class Medic_creep extends Creep
{
    public Medic_creep(int x, int y, int h, int s, int d)
    {
		super(x, y, h, s, d);
	}

	public Medic_creep(Creep copy, int d)
    {
    	super(copy, d);
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
	    		g.setColor(Color.white);

	    	if(visible)
	    		g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.black);
	    	g.drawArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));

			
			g.setColor(Color.red);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString("+",getX()-(2/diviser),getY()+(2/diviser));

	    	g.setColor(Color.green);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString(""+health,getX()-(10/diviser),getY()-(20/diviser));

	    	if(animation == 0)
	    		g.fillOval(getX()-(100/diviser), getY()-(100/diviser), (200/diviser), (200/diviser));

	    	if(animation >= 30)
	    		animate = -1;

	    	if(animation <= 0)
	    		animate = 1;

	    	animation += animate*5;
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