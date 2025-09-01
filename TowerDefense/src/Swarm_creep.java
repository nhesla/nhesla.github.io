import java.awt.*;   
import java.applet.Applet; 
import java.util.Random;

public class Swarm_creep extends Creep  
{
    public Swarm_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
		
	public Swarm_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
}